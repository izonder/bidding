import bunyan from 'bunyan';

const STREAM_STDOUT = 'stdout',
    STREAM_FILE = 'file',
    STREAM_ROTATE = 'rotate';

export default class LoggerFactory {
    /**
     * Logger
     *
     * Config example:
     * [{
     *     "name": "myLogger",
     *     "type": "file",
     *     "level": "debug",
     *     "config": {
     *         "path": "./logs/app.log"
     *     }
     * }]
     *
     * @param {Object} options
     */
    constructor(options = {}) {
        const {req: request, res: response, err: e} = bunyan.stdSerializers;

        this.options = options || {};
        this.logger = bunyan.createLogger({
            serializers: {request, response, e},
            ...this.options,
            name: this.options?.name || 'application',
            streams: this.initStreams(this.options?.streams || [{type: STREAM_STDOUT}])
        });
    }

    /**
     * Logger getter
     * @param {string|null} module
     * @returns {Logger}
     */
    get(module = null) {
        return module ? this.logger.child({module}) : this.logger;
    }

    /**
     * Add streams
     * @param {Array.<{type, name, level, config}>} streams
     */
    addStreams(streams) {
        this.initStreams(streams)
            .forEach((stream) => this.logger.addStream(stream));
    }

    /**
     * Initialize streams
     * @param {Array.<{type, name, level, config}>} options
     * @returns {Array.<{name, stream, level, config}>}
     */
    initStreams(options = []) {
        return (options || [])
            .map((record) => {
                let opts = {};

                switch (record?.type) {
                    case STREAM_FILE:
                        opts = {
                            type: 'file',
                            path: record?.config?.path || '',
                            ...record?.config || {}
                        };
                        break;

                    case STREAM_ROTATE:
                        opts = {
                            type: 'rotating-file',
                            path: record?.config?.path || '',
                            ...record?.config || {}
                        };
                        break;

                    case STREAM_STDOUT:
                    default:
                        opts = {
                            stream: process.stdout
                        };
                }

                return {
                    ...opts,
                    name: record?.name || 'default',
                    level: record?.level || bunyan.DEBUG
                };
            });
    }
}
