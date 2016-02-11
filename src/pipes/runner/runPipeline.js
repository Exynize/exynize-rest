import _ from 'lodash';
import uuid from 'node-uuid';
import {Component} from '../../db';
import logger from '../../logger';
import {runWithRabbit, serviceWithRabbit, stopWithRabbit} from '../../runner';

export const runPipeline = async (pipeline) => {
    // logger.debug('running pipeline:', pipeline);
    const toKill = [];
    // get source
    const {source} = pipeline;
    const sourceId = uuid.v4();
    logger.debug('starting source with id:', sourceId);
    // get sources for componnets without source
    logger.debug('getting sources for components...');
    const componentsWithSource = pipeline.components.filter(c => c.source);
    const componentsWithoutSource = pipeline.components.filter(c => !c.source);
    for (const comp of componentsWithoutSource) {
        logger.debug('component does not have source:', comp);
        const c = await Component.get(comp.id);
        const res = {
            ...comp,
            ...c,
        };
        componentsWithSource.push(res);
    }
    logger.debug('all comps:');
    logger.debug(JSON.stringify(componentsWithSource));
    // init source
    const srcRx = runWithRabbit({
        source: source.source,
        componentType: 'source',
        args: source.args,
        id: sourceId,
    })
    // remove id from kill list when it's done
    .doOnCompleted(() => {
        logger.debug('source done, removing from kill list', toKill);
        _.remove(toKill, it => it === sourceId);
        logger.debug('removed source from kill list', toKill);
    });
    // say we need to kill it
    toKill.push(sourceId);
    // init components with ids
    const components = componentsWithSource //pipeline.components
    // map with new metadata
    .map(comp => {
        // assign id and type
        comp.id = uuid.v4();
        comp.componentType = 'processor';
        // say we need to kill it
        toKill.push(comp.id);
        return comp;
    })
    // map to services
    .map(comp => serviceWithRabbit(comp));

    // reduce to stream and return
    const stream = components.reduce((s, fn) => s.flatMap(fn), srcRx);

    // return
    return {
        stream,
        clean() {
            logger.debug('got clean command:', toKill);
            return toKill.map(id => stopWithRabbit(id));
        },
    };
};
