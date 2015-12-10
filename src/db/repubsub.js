/* eslint no-underscore-dangle: 0 */
// Implementation of message queueing on top of RethinkDB changefeeds.

// In this model, exchanges are databases, and documents are topics. The
// current value of the topic in the database is just whatever the last
// message sent happened to be. The document only exists to force
// RethinkDB to generate change notifications for changefeed
// subscribers. These notifications are the actual messages.

// Internally, RethinkDB buffers changefeed notifications in a buffer per
// client connection. These buffers are analogous to AMQP queues. This
// has several benefits vs. (for example) having one document per
// message:

// * change notifications aren't created unless someone is subscribed
// * notifications are deleted as soon as they're read from the buffer
// * the notification buffers are implicitly ordered, so no sorting needs
//   to happen at the query level.

// One large difference from existing message queues like RabbitMQ is
// that there is no way to cause the change buffers to be persisted
// across connections. Because of this, if the client sends a STOP
// request to the changefeed, or disconnects, the queue is effectively
// lost. Any messages on the queue are unrecoverable.
import r from 'rethinkdb';

// Represents a topic that may be published to
export class Topic {
    constructor(exchange: Exchange, topicKey: string) {
        this.exchange = exchange;
        this.key = topicKey;
    }

    // Publish a payload to the current topic
    publish(payload: any) {
        return this.exchange.publish(this.key, payload);
    }
}


// A queue that filters messages in the exchange
export class Queue {
    constructor(exchange: Exchange, filterFunc: Function) {
        this.exchange = exchange;
        this.filterFunc = filterFunc;
    }

    // Returns the full ReQL query for this queue
    fullQuery() {
        return this.exchange.fullQuery(this.filterFunc);
    }

    // Subscribe to messages from this queue's subscriptions
    subscribe(iterFunc: Function) {
        return this.exchange.subscribe(this.filterFunc, iterFunc);
    }
}

// Represents a message exchange which messages can be sent to and
// consumed from. Each exchange has an underlying RethinkDB table.
export class Exchange {
    constructor(name: string, connOpts: Object) {
        this.db = connOpts.db = connOpts.db || 'test';
        this.name = name;
        this.conn = null;
        this.table = r.table(name);
        this._asserted = false;

        // Bluebird's .bind ensures `this` inside our callbacks is the exchange
        this.promise = r.connect(connOpts).bind(this)
        .then(function(conn) {
            this.conn = conn;
        })
        .catch(r.Error.RqlRuntimeError, function(err) {
            console.log(err.message);
            process.exit(1);
        });
    }

    // Returns a topic in this exchange
    topic(name: string) {
        return new Topic(this, name);
    }

    // Returns a new queue on this exchange that will filter messages by
    // the given query
    queue(filterFunc: Function) {
        return new Queue(this, filterFunc);
    }

    // The full ReQL query for a given filter function
    fullQuery(filterFunc: Function) {
        return this.table.changes()('new_val').filter(function(row) {
            return filterFunc(row('topic'));
        });
    }

    // Publish a message to this exchange on the given topic
    publish(topicKey: string, payload: Object) {
        return this.assertTable()
        .then(function() {
            const topIsObj = Object.prototype.toString.call(topicKey) === '[object Object]';
            const topic = topIsObj ? r.literal(topicKey) : topicKey;
            return this.table
            .filter({topic})
            .update({
                payload,
                updated_on: r.now() // eslint-disable-line
            })
            .run(this.conn);
        })
        .then(function(updateResult) {
            // If the topic doesn't exist yet, insert a new document. Note:
            // it's possible someone else could have inserted it in the
            // meantime and this would create a duplicate. That's a risk we
            // take here. The consequence is that duplicated messages may
            // be sent to the consumer.
            if (updateResult.replaced === 0) {
                return this.table
                .insert({
                    payload,
                    topic: topicKey,
                    updated_on: r.now() // eslint-disable-line
                })
                .run(this.conn);
            }

            return updateResult;
        });
    }

    // Receives a callback that is called whenever a new message comes in
    // matching the filter function
    subscribe(filterFunc: Function, iterFunc: Function) {
        return this.assertTable()
        .then(function() {
            return this.fullQuery(filterFunc).run(this.conn);
        })
        .then(function(cursor) {
            cursor.each(function(err, message) { // eslint-disable-line
                iterFunc(message.topic, message.payload);
            });
        });
    }

    // Ensures the table specified exists and has the correct primary_key
    // and durability settings
    assertTable() {
        return this.promise.then(function() {
            if (this._asserted) {
                return;
            }

            return r.dbCreate(this.db).run(this.conn).bind(this) // eslint-disable-line
            .finally(function() {
                return r.db(this.db).tableCreate(this.name).run(this.conn).bind(this);
            })
            .catch(r.Error.RqlRuntimeError, function(err) {
                if (err.msg.indexOf('already exists') === -1) {
                    throw err;
                }
            })
            .then(function() {
                this._asserted = true;
            });
        });
    }
}
