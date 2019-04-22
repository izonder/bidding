class Container extends Map {
    /**
     * Dependencies container
     */
    constructor() {
        super();
    }

    /**
     * Load data bulky
     * @param {Array.<Array>} data
     * @returns {Container}
     */
    with(data) {
        data.forEach(([key, value]) => {
            this.set(key, value);
        });
        return this;
    }

    /**
     * Override constructor species to the parent Map constructor
     * @returns {MapConstructor}
     */
    static get [Symbol.species]() {
        return Map;
    }
}

export default new Container();
