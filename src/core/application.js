import {existsSync} from 'fs';
import {resolve} from 'path';
import Config from './config';
import Container from './container';
import Logger from './logger';
import Mediator from './mediator';

const TYPE_DRIVER = 'driver',
    TYPE_MODULE = 'module',
    DEFAULT_ROOT_PATH = resolve(__dirname, '..'),
    DEFAULT_DRIVERS_PATH = 'drivers';

export default class Application {
    /**
     * Application bootstrap
     * Emit:
     * application:run - application is initialized successfully
     * @param {{name, version, configs, rootPath, driversPath, modulesPath, dependencies}} options
     */
    constructor(options = {}) {
        this.options = options;

        this.name = process.title = process.env.APP_NAME || options?.name;
        this.version = options?.version || '0.0.0';

        this.rootPath = options.rootPath || '..';
        this.driversPath = options.driversPath || 'drivers';
        this.modulesPath = options.modulesPath || 'modules';

        this.logger = new Logger({name: this.name});
        this.config = new Config(this.logger.get('core/config')).with(options?.configs);
        this.container = Container.with(this.options?.dependencies || []);

        //register constants
        this.container.set('application/name', this.name);
        this.container.set('application/version', this.version);
        this.container.set('application/rootPath', this.rootPath);
        this.container.set('application/driversPath', this.driversPath);
        this.container.set('application/modulesPath', this.modulesPath);
    }

    /**
     * Run application
     * @returns {Promise}
     */
    async run() {
        try {
            await this.config.initialize();
            await this.initialize();
            await this.startDrivers();
            await this.startModules();
            await this.succeed();
        }
        catch (e) {
            this.failed(e);
        }

        return this;
    }

    /**
     * Container getter
     * @returns {Container}
     */
    getContainer() {
        return this.container;
    }

    /**
     * Config getter
     * @returns {Config}
     */
    getConfig() {
        return this.config;
    }

    /**
     * Application initialization
     * @returns {Promise}
     */
    async initialize() {
        const config = this.config.get();

        this.logger.addStreams(config?.application?.logger);
        this.log = this.logger.get('core/application');

        this.log.info('========== Application launch ==========');

        this.mediator = new Mediator(config?.application?.mediator);

        //register services
        this.container.set('config', this.config);
        this.container.set('logger', this.logger);
        this.container.set('mediator', this.mediator);
    }

    /**
     * Start drivers
     * @returns {Promise}
     */
    startDrivers() {
        const config = this.config.get('drivers');

        return this.runComponent(TYPE_DRIVER, config);
    }

    /**
     * Start modules
     * @returns {Promise}
     */
    startModules() {
        const config = this.config.get('modules');

        return this.runComponent(TYPE_MODULE, config);
    }

    /**
     * Initialized successfully
     */
    succeed() {
        this.log.info('application run!');
        this.mediator.emit('application:run');
    }

    /**
     * Initialization is failed
     * @param {Error} e
     */
    failed(e) {
        this.log.error({e}, 'process shut down because of failed initialization');
        process.exit(-1); //eslint-disable-line
    }

    /**
     * Component runner
     * @param {string} type
     * @param {*} config
     * @returns {Promise}
     */
    async runComponent(type, config) {
        this.log.info(`=== components with type "${type}" are starting... ===`);

        const components = Object
            .entries(config || {})
            .filter(([, component]) => component?.enabled)
            .map(([name, component]) => this.instantiateComponent(type, name, component));

        if (!components.length) this.log.warn(`no components with type "${type}"!`);

        return Promise.all(components).then(() => this.log.info(`=== components with type "${type}" are ready! ===`));
    }

    /**
     * Instantiate component
     * @param {string} type
     * @param {string} name
     * @param {*} config
     * @returns {Promise}
     */
    async instantiateComponent(type, name, config) {
        let Component,
            instance;

        switch (type) {
            case TYPE_MODULE:
                Component = require(this.resolvePath(name, this.modulesPath, this.rootPath, false)).default; //eslint-disable-line global-require
                instance = new Component(this.container, config?.config || {});
                break;

            case TYPE_DRIVER:
                //eslint-disable-next-line no-case-declarations
                const customPath = this.resolvePath(config?.driver, this.driversPath, this.rootPath),
                    commonPath = this.resolvePath(config?.driver, DEFAULT_DRIVERS_PATH, DEFAULT_ROOT_PATH),
                    componentPath = existsSync(customPath) && customPath || existsSync(commonPath) && commonPath;

                try {
                    Component = require(componentPath).default; //eslint-disable-line global-require
                }
                catch (e) {
                    throw new Error(`unknown driver for "${name}" [${config?.driver}]`);
                }
                instance = new Component(config?.config || {}, this.logger.get(`driver/${name}`));
        }

        //initialize component
        return this.initializeComponent(type, name, instance);
    }

    /**
     * Resolve component path
     * @param {string} name
     * @param {string} relativePath
     * @param {string} root
     * @param {boolean} withExtension
     * @returns {string}
     */
    resolvePath(name, relativePath, root, withExtension = true) {
        return resolve(root, relativePath, withExtension ? `${name}.js` : name);
    }

    /**
     * Initialize component and register in service container
     * NOTE: method <init> (if exists) should return Promise
     * @param {string} type
     * @param {string} name
     * @param {*} instance
     * @returns {Promise}
     */
    async initializeComponent(type, name, instance) {
        //inject puppet async init() method if it doesn't exist
        if (!instance.init) instance.init = async () => {};

        try {
            await instance.init();
            this.container.set(`${type}/${name}`, instance.getInstance ? instance.getInstance() : instance);
            this.log.info(`${type} initialized: ${name}`);
        }
        catch (e) {
            //the application MUST fall if a component doesn't run
            this.log.warn({e}, `${type} initializing failed: ${name}`);
            throw e;
        }
    }
}

/**
 * Bootstrap function
 * @param {Object} options
 * @returns {Promise.<Application>}
 */
export const app = (options) => { //eslint-disable-line one-var
    return new Application(options).run();
};
