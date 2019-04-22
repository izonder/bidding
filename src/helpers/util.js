export const
    /**
     * Is it Array?
     * @param {*} obj
     * @returns {boolean}
     */
    isArray = (obj) => {
        return !!Array.isArray(obj);
    },

    /**
     * Is it Object?
     * @param {*} obj
     * @returns {boolean}
     */
    isObject = (obj) => {
        return !!(obj && (typeof obj === 'object') && (obj.toString() === '[object Object]'));
    },

    /**
     * Is it iterable
     * @param {*} obj
     * @returns {boolean}
     */
    isIterable = (obj) => {
        return !!(isArray(obj) || isObject(obj));
    },

    /**
     * Is it Undefined?
     * @param {*} obj
     * @returns {boolean}
     */
    isUndefined = (obj) => {
        return typeof obj === 'undefined';
    },

    /**
     * Is it Null?
     * @param {*} obj
     * @returns {boolean}
     */
    isNull = (obj) => {
        return !!(!obj && (typeof obj === 'object'));
    },

    /**
     * Is it Empty?
     * @param {*} obj
     * @returns {boolean}
     */
    isEmpty = (obj) => {
        return !!(isUndefined(obj) || isNull(obj));
    },

    /**
     * Clone the object
     * @param {*} obj
     * @returns {*}
     */
    clone = (obj) => {
        let result = null;

        if (isIterable(obj)) {
            result = isArray(obj) ? [] : {};
            for (const i in obj) {
                if (obj.hasOwnProperty(i)) {
                    if (isIterable(obj[i])) result[i] = clone(obj[i]);
                    else result[i] = obj[i];
                }
            }
        }
        else result = obj;

        return result;
    },

    /**
     * Extend object
     * @param {*} source
     * @param {*} target
     * @returns {*}
     */
    extend = (source, target) => {
        const result = clone(source);

        if (isIterable(target)) {
            for (const i in target) {
                if (target.hasOwnProperty(i)) {
                    if (isIterable(target[i])) {
                        if (!result[i]) result[i] = isArray(target[i]) ? [] : {}; //eslint-disable-line max-depth
                        result[i] = extend(result[i], target[i]);
                    }
                    else result[i] = target[i];
                }
            }
        }
        return result;
    },

    /**
     * Mixin objects
     * @param {*} source
     * @param {*} target
     * @returns {*}
     */
    mixin = (source, target) => {
        const result = clone(source);

        if (isIterable(result) && isIterable(target)) {
            for (const i in result) {
                if (result.hasOwnProperty(i) && !isEmpty(target[i])) {
                    if (result[i] && isIterable(result[i])) {
                        result[i] = mixin(result[i], target[i]);
                    }
                    else result[i] = target[i];
                }
            }
        }
        return result;
    };
