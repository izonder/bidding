import got from 'got';
import Driver from 'core/driver';
import {flow} from 'helpers/flow';
import {extend} from 'helpers/util';

const defaults = {
    baseUrl: '',
    path: '',
    query: {},
    method: 'GET',
    payload: null,
    username: null,
    password: null,
    headers: {
        'user-agent': null
    },
    decompress: true,
    type: 'json',
    retries: 3,
    timeout: 600000,
    silent: false,
    forceInsecureSSL: false,
    mock: {
        emulate: false,
        silent: false
    }
};

export default class Rest extends Driver {
    /**
     * REST client constructor
     *
     * Config/options fields:
     * baseUrl          <string>    - base url
     * path             <string>    - remain or mutable part of url
     * query            <Object>    - query options
     * method           <string>    - HTTP method
     * payload          <string|*>  - posting data
     * username         <string>    - BasicAuth username
     * password         <string>    - BasicAuth password
     * headers          <Object>    - object with headers
     * decompress       <boolean>   - handle gzip
     * type             <json|text> - content type
     * retries          <number>    - number of attempts
     * timeout          <number>    - timeout for the request
     * silent           <boolean>   - suppress all debug outputs
     * forceInsecureSSL <boolean>   - suppress SSL/TLS exceptions
     * mock             <Object>    - the request emulating options
     *
     * delay            <number>    - awaiting for the server starts sending [DEPRECATED]
     * buffer           <boolean>   - buffering as `text` [DEPRECATED]
     *
     * The 'mock' object fields:
     * emulate          <boolean>   - use emulation instead of real-time requests
     * silent           <boolean>   - suppress Mock responses debug output
     * response         <Object>    - snapshot of response object
     *
     * @param {*} args
     */
    constructor(...args) {
        super(...args);

        this.setConfig(extend(defaults, this.getConfig()));
    }

    /**
     * Bind middleware
     * @param {Array.<function(params): params>} plugins
     * @returns {function(params?): Promise}
     */
    with(...plugins) {
        return async (params = {}) => {
            return this.request(await flow(...plugins)(params));
        };
    }

    /**
     * Handle rest calls
     * @param {Object} params
     * @returns {Promise}
     */
    request(params = {}) {
        const options = extend(this.getConfig(), params),
            {path, mock} = options;

        if (mock?.emulate) return this.emulate(options);
        return this.process(path, options);
    }

    /**
     * Emulate request
     * @param {*} options
     * @returns {Promise}
     */
    emulate(options) {
        const {mock, payload} = options || {},
            response = mock?.response || {ok: true},
            silent = options?.silent || mock?.silent;

        if (!silent) {
            this.log().debug('emulation - request options:', options);
            this.log().debug('emulation - request data:', payload);
            this.log().debug('emulation - response:', response);
        }

        return Promise.resolve(response);
    }

    /**
     * Process request
     * @param {string} path
     * @param {*} options
     * @returns {Promise}
     */
    process(path, options) {
        const {forceInsecureSSL, silent} = options;

        if (forceInsecureSSL) {
            if (!silent) this.log().debug('insecure SSL forced');
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }

        return got(path, this.mapOptions(options));
    }

    /**
     * Bridge differences between Rest driver options schema and Got options schema
     * @param {*} options
     * @returns {*}
     */
    mapOptions(options) {
        const {method, payload, username, password, type, retries} = options || {};

        return {
            ...options,
            method: (method || '').toLowerCase(),
            body: payload,
            auth: username && password ? [username, password].join(':') : null,
            json: (type || '').toLowerCase() === 'json',
            retry: retries
        };
    }
}
