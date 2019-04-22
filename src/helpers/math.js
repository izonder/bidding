import v4 from 'uuid/v4';
import v5 from 'uuid/v5';

export const
    /**
     * Round floats to thousands
     * NOTE: Math.round(1.005 * 100) / 100 => 1 (should be 1.01)
     * https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Math/round
     * @param {number} number
     * @returns {number}
     */
    roundNumber = (number) => {
        const EXP = -2;
        let exp,
            value = number;

        //shift
        value = value.toString().split('e');
        exp = value[1] ? +value[1] - EXP : -EXP;
        value = Math.round(+`${value[0]}e${exp}`);

        //back shift
        value = value.toString().split('e');
        exp = value[1] ? +value[1] + EXP : EXP;

        return +`${value[0]}e${exp}`;
    },

    /**
     * Format number to fixed string
     * @param {number} number
     * @returns {string}
     */
    formatNumber = (number) => {
        const digits = 2;
        return Number(number).toFixed(digits);
    },

    /**
     * Create uuid (uuid library wrapper)
     * @returns {uuid}
     */
    createUuid = () => {
        return v4();
    },

    /**
     * Calculate uuid (reproducible)
     * @param {string} key
     * @param {uuid} namespace
     * @returns {*}
     */
    calculateUuid = (key, namespace = createUuid()) => {
        return v5(key, namespace);
    },

    /**
     * Create string key
     * @param {*} args
     * @returns {string}
     */
    createKey = (...args) => {
        return args
            .map((item) => item && item.toString ? item.toString() : '')
            .join('');
    },

    /**
     * IDs generators factory
     * @param {uuid} uuidNamespace
     * @returns {function(...[*])}
     */
    uuidGenerator = (uuidNamespace) => {
        return (...args) => {
            return calculateUuid(createKey(...args), uuidNamespace);
        };
    };
