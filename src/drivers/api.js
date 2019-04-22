import fs from 'fs';
import path from 'path';
import url from 'url';
import HttpErrors from 'http-errors';
import Koa from 'koa';
import Router from 'koa-router';
import koaBody from 'koa-body';
import serve from 'koa-static';
import mount from 'koa-mount';
import cors from '@koa/cors';
import swaggerJSDoc from 'swagger-jsdoc';
import Container from 'core/container';
import Driver from 'core/driver';
import {calcDuration} from 'helpers/date';
import {flow} from 'helpers/flow';
import {extend} from 'helpers/util';

const
    DEFAULT_PORT = 3000,
    DEFAULT_TIMEOUT = 30000,

    corsOpts = {
        exposeHeaders: ['X-Request-Id'],
        credentials: true,
        keepHeadersOnError: true
    },
    parserOpts = {};

export default class Api extends Driver {
    /**
     * REST API driver constructor
     *
     * Config/options fields:
     * cors         <Object>        - CORS configuration (https://github.com/koajs/cors)
     * listen       <string|number> - port/unix-socket path for exposing web-server
     * parser       <Object>        - parser configuration (https://github.com/dlau/koa-body)
     * ping         <boolean>       - expose `/ping` endpoint
     * pingSetup    <Object>        - extended ping setup configuration (see below)
     * router       <Object>        - router options (https://github.com/ZijianHe/koa-router)
     * server       <Object>        - web-server initialization configuration (https://github.com/koajs/koa)
     * swagger      <boolean>       - expose `/swagger` endpoint
     * swaggerSetup <Object>        - extended swagger setup configuration (see below)
     * timeout      <number>        - initialisation timeout
     *
     * @param {*} args
     */
    constructor(...args) {
        super(...args);

        this.middleware = [];
        this.server = new Koa(this.getConfig()?.server);
        this.router = new Router(this.getConfig()?.router);
    }

    /**
     * Initialize method
     * @returns {Promise}
     */
    init() {
        return new Promise((resolve) => {
            const config = this.getConfig(),
                handler = config?.listen || DEFAULT_PORT,
                timeout = config?.timeout || DEFAULT_TIMEOUT,
                isSocket = typeof handler === 'string' && /\/\w+/.test(handler),
                timeoutHandler = setTimeout(() => {
                    this.log().error(`instantiate timeout exceeded = ${timeout}`);
                    throw new Error(`instantiate timeout exceeded = ${timeout}`);
                }, timeout);

            //set ping and swagger methods
            if (config?.ping) this.setupPing();
            if (config?.swagger) this.setupSwagger();

            //middlewares
            this.server.use(cors({...corsOpts, ...config?.cors || {}}));
            this.server.use(koaBody({...parserOpts, ...config?.parser || {}}));
            this.server.use(this.router.routes());
            this.server.use(this.router.allowedMethods());

            //start listening
            if (isSocket) this.cleanUnixSocket(handler);
            this.server.listen(handler, () => {
                if (isSocket) this.chmodUnixSocket(handler);

                this.log().debug(`instantiated successfully [listen = ${handler}]`);
                clearTimeout(timeoutHandler);
                resolve(this.server);
            });
        });
    }

    /**
     * Server getter
     * @returns {Koa}
     */
    getServer() {
        return this.server;
    }

    /**
     * Router getter
     * @returns {Router}
     */
    getRouter() {
        return this.router;
    }

    /**
     * Re-export errors object
     * @returns {Object}
     */
    errors() {
        return HttpErrors;
    }

    /**
     * Setup middleware for pre-requests
     * @param {Array.<function(Context): Context>} handlers
     */
    with(...handlers) {
        this.middleware.push(...handlers);
    }

    /**
     * Mount a service, batch register
     * Expected structure of config:
     * {...
     *      <endpoint>: [{<method>, <handler>}, ...]
     * ...}
     *
     * @param {Object} config
     * @param {string} mountPath
     */
    mount(config, mountPath = '/') {
        Object
            .entries(config || {})
            .forEach(([endpoint, options]) => this.register(url.resolve(mountPath, endpoint), options));
    }

    /**
     * Serve static pages
     * @param {string} uri
     * @param {string} staticPath
     */
    static(uri, staticPath) {
        const server = new Koa();

        server.use(serve(staticPath));
        this.server.use(mount(uri, server));
    }

    /**
     * Clean up UNIX-socket
     * @param {string} unixSocket
     */
    cleanUnixSocket(unixSocket) {
        if (fs.existsSync(unixSocket)) {
            try {
                fs.unlinkSync(unixSocket);
            }
            catch (e) {
                this.log().error({e}, `unix-socket unlink error, unix: ${unixSocket}`);
                throw e;
            }
        }
    }

    /**
     * Chmod UNIX-socket
     * @param {string} unixSocket
     */
    chmodUnixSocket(unixSocket) {
        try {
            fs.chmodSync(unixSocket, '777');
            this.log().debug(`bound unix-socket: ${unixSocket}`);
        }
        catch (e) {
            this.log().error({e}, `can't chmod unix-socket: ${unixSocket}`);
            throw e;
        }
    }

    /**
     * Register ping resource
     *
     * Config in field `pingSetup`, e.g.:
     * {
     *     "path": "/healthcheck",
     *     "method": "GET",
     *     "status": "200",
     *     "body": {
     *         "status": "up"
     *     }
     * }
     *
     */
    setupPing() {
        const defaultConfig = {
                path: '/ping',
                method: 'HEAD',
                status: 204,
                body: null
            },
            config = extend(defaultConfig, this.getConfig()?.pingSetup || {});

        this.register(config?.path, [
            {
                method: config?.method,
                handler: (ctx) => {
                    ctx.status = config?.status;
                    ctx.body = config?.body;
                }
            }
        ]);
    }

    /**
     * Register swagger resource
     *
     * Config in field `swaggerSetup`, e.g.:
     * {
     *     "path": "/swagger",
     *     "definition": {
     *         "host": "api.myapp.tld",
     *         "basePath": "/api/",
     *         "info": {
     *             "version": "1.2.3"
     *         }
     *         //learn more https://swagger.io/docs/specification/2-0/basic-structure/
     *     },
     *     "resolve": [
     *         "/src/**\/*.ctrl.js",
     *         "/src/**\/*.ctrl.ts",
     *     ]
     * }
     */
    setupSwagger() {
        const defaultConfig = {
                path: '/swagger',
                definition: {
                    info: {
                        title: Container.get('application/name'),
                        version: Container.get('application/version')
                    },
                    schemes: ['http', 'https']
                },
                resolve: [path.join(Container.get('application/rootPath'), './**/*.js')]
            },
            config = extend(defaultConfig, this.getConfig()?.swaggerSetup || {}),
            spec = swaggerJSDoc({
                swaggerDefinition: config.definition,
                apis: config.resolve
            });

        this.register(config?.path, [
            {
                method: 'GET',
                handler: (ctx) => {
                    ctx.body = spec;
                }
            }
        ]);
    }

    /**
     * Register resource
     * @param {string} endpoint
     * @param {Array<Object>} config
     */
    register(endpoint, config) {
        if (Array.isArray(config)) {
            for (const item of config) {
                let {method, handler} = item || {};
                method = (method || '').toLowerCase();

                if (method && typeof this.router[method] === 'function' && handler && typeof handler === 'function') {
                    this.router[method](endpoint, this.createHandler(handler));
                    this.log().debug(`resource exposed = ${endpoint}, method = ${method}`);
                }
            }
        }
        else this.log().warn('wrong type of configuration, should be an array');
    }

    /**
     * Create a handler
     *
     * NOTE: API versioning might be implemented not only prefix way, e.g.:
     *
     * ```javascript
     * import resolver from 'koa-router-version';
     *
     * this.mount({
     *     '/endpoint', [
     *         {
     *             method: 'GET',
     *             handler: resolver.version(
     *                 {
     *                     '1.0.0': handlerOne,
     *                     '2.0.0': handlerTwo
     *                 },
     *                 {
     *                     defaultVersion: '1.0.0'
     *                 }
     *             )
     *         }
     *     ]
     * });
     * ```
     *
     * @param {Function} handler
     * @returns {Function}
     */
    createHandler(handler) {
        return async (ctx, next) => {
            const duration = calcDuration();

            try {
                const result = await handler(await flow(...this.middleware)(ctx));

                ctx.body = ctx.body || result || null;

                this.log().debug(
                    {request: ctx.req, response: ctx.res},
                    `${ctx.status} ${ctx.method} ${ctx.path} [${duration()}ms]`
                );
            }
            catch (e) {
                const {HttpError, InternalServerError} = this.errors();
                let error = e;

                if (!(e instanceof HttpError)) {
                    this.log().error({e}, 'uncaught exception');
                    error = new InternalServerError('Unexpected error');
                }

                ctx.status = error.status;
                this.log().warn(
                    {request: ctx.req, response: ctx.res, e},
                    `${ctx.status} ${ctx.method} ${ctx.path} [${duration()}ms]`
                );

                if (ctx.is('json')) ctx.body = {status: error.status, message: error.message};
                else ctx.throw(error);
            }

            return next();
        };
    }
}
