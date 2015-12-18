import uuid from 'node-uuid';
import logger from '../../logger';
import {runWithRabbit, serviceWithRabbit, stopWithRabbit} from '../../runner';

export const runPipeline = (pipeline) => {
    // logger.debug('running pipeline:', pipeline);
    const toKill = [];
    // get source
    const {source} = pipeline;
    const sourceId = uuid.v1();
    logger.debug('starting source with id:', sourceId);
    // init source
    const srcRx = runWithRabbit({
        source: source.source,
        componentType: 'source',
        args: source.args,
        id: sourceId,
    });
    // say we need to kill it
    toKill.push(sourceId);
    // init components with ids
    const components = pipeline.components
    // map with new metadata
    .map(comp => {
        // assign id and type
        comp.id = uuid.v1();
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
            toKill.map(id => stopWithRabbit(id));
        },
    };
};
