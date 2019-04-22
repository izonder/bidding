import {EventEmitter2} from 'eventemitter2';

const MAX_LISTENERS = 100;

export default class Mediator extends EventEmitter2 {
    /**
     * Mediator
     * @param {{}} options
     */
    constructor(options = {}) {
        super({
            wildcard: true,
            maxListeners: MAX_LISTENERS,
            verboseMemoryLeak: true,
            ...options || {}
        });
    }
}
