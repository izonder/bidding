import objectPath from 'object-path';

const DEFAULT_ENVIRONMENT = 'development';

export default class Config {
    /**
     * Configs initialization
     * @param {Logger} logger
     */
    constructor(logger) {
        this.configs = new Map();
        this.logger = logger;

        this.environment = process.env.APP_ENV || process.env.NODE_ENV || DEFAULT_ENVIRONMENT;
    }

    /**
     * Assign local configs
     * @param {Object} configs
     * @returns {Config}
     */
    with(configs = {}) {
        Object
            .entries(configs)
            .forEach(([key, config]) => {
                this.configs.set(key, config);
            });
        return this;
    }

    /**
     * Initializing with obtaining remote config
     * @returns {Promise}
     */
    async initialize() {
        this.logger.info(`********** Environment: ${this.environment} **********`);
    }

    /**
     * Get config
     * @param {string|Array.<string>} path
     * @returns {*}
     */
    get(path = '') {
        const config = this.configs.get(this.environment);

        if (!config) {
            this.logger.fatal('no config, process shutdown...');
            process.exit(-1); //eslint-disable-line
        }

        return objectPath.get(config || {}, path);
    }
}
