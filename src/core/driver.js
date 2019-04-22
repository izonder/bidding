export default class Driver {
    #config = null;
    #logger = null;

    /**
     * Module prototype
     * @param {Object} config
     * @param {Logger} logger
     */
    constructor(config, logger) {
        this.#config = config;
        this.#logger = logger;
    }

    /**
     * Abstract method for initialization
     * @returns {Promise<void>}
     */
    async init() {}

    /**
     * Abstract instance getter
     * @returns {*}
     */
    getInstance() {
        return this;
    }

    /**
     * Config setter
     * @param {*} config
     */
    setConfig(config) {
        this.#config = config;
    }

    /**
     * Config getter
     * @returns {Object}
     */
    getConfig() {
        return this.#config;
    }

    /**
     * Logger getter
     * @returns {Logger}
     */
    log() {
        return this.#logger;
    }
}
