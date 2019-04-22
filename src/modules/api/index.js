import {Module} from 'core';
import {BidModel} from 'models/bid.model';

const DELIMITER = ',';

export default class ApiModule extends Module {
    /**
     * API module
     */
    constructor() {
        super(...arguments);

        this.api = this.getContainer().get('driver/api');
        this.store = new BidModel();

        this.schema = {
            'config': [
                {
                    method: 'GET',
                    handler: ::this.storeConfig
                }
            ],
            'bid': [
                {
                    method: 'GET',
                    handler: ::this.getBid
                }
            ]
        };
        this.api.mount(this.schema, '/');
    }

    /**
     * Store config method
     * @param {Object} ctx
     * @returns {Promise<*>}
     */
    async storeConfig(ctx) {
        const {BadRequest} = this.api.errors(),
            {id, seg} = ctx.query;

        if (!id) throw new BadRequest();

        (seg || '')
            .split(DELIMITER)
            .forEach((i) => {
                this.store.set(id, i);
            });
        this.store.commit();
    }

    /**
     * Get bids method
     * @param {Object} ctx
     * @returns {Promise<*>}
     */
    async getBid(ctx) {
        const {seg} = ctx.query,
            ids = (seg || '').split(DELIMITER),
            result = this.store.getByList(ids);

        return Array.from(result).join(DELIMITER);
    }
}
