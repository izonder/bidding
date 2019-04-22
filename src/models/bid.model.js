export class BidModel {
    #collection = new Map();
    #index = new Map();

    /**
     * Commit updates and refresh index
     */
    commit() {
        const index = new Map();

        for (const [id, bid] of this.#collection) {
            for (const seg of bid) {
                const entry = index.get(seg) || new Set();

                entry.add(id);
                index.set(seg, entry);
            }
        }

        this.#index = index;
    }

    /**
     * Set bid
     * @param {string} id
     * @param {string} seg
     */
    set(id, seg) {
        const bid = this.#collection.get(id) || new Set();

        bid.add(seg);
        this.#collection.set(id, bid);
    }

    /**
     * Get bid
     * @param {string} seg
     * @returns {Set}
     */
    get(seg) {
        return this.#index.get(seg) || new Set();
    }

    /**
     * Get bid by IDs list
     * @param {Array.<string>} ids
     * @returns {Set}
     */
    getByList(ids) {
        const result = [];

        for (const id of ids) {
            const index = this.#index.get(id);
            if (index) result.push(...index);
        }

        return new Set(result);
    }
}
