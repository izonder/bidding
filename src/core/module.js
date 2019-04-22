export default class Module {
    #config = null;
    #container = null;
    #logger = null;

    /**
     * Module prototype
     * @param {Map} container
     * @param {Object} config
     */
    constructor(container, config) {
        this.#container = container;
        this.#config = config;

        this.#logger = container.get('logger')?.get(this.constructor.name);
    }

    /**
     * Abstract method for initialization
     * @returns {Promise<void>}
     */
    async init() {}

    /**
     * Config getter
     * @returns {Object}
     */
    getConfig() {
        return this.#config;
    }

    /**
     * Container getter
     * @returns {Map}
     */
    getContainer() {
        return this.#container;
    }

    /**
     * Logger getter
     * @returns {Logger}
     */
    log() {
        return this.#logger;
    }
}
