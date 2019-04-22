import * as momentBase from 'moment';
import {extendMoment} from 'moment-range';

const moment = extendMoment(momentBase);

export const //eslint-disable-line one-var
    /**
     * Date constants
     * @type {Moment}
     */
    DEFAULT_MIN_DATE = moment.utc(new Date('1970-01-01')),
    DEFAULT_MAX_DATE = moment.utc(new Date('2100-01-01')),
    DATE_FORMAT_DEFAULT = 'YYYY-MM-DD',
    DATE_FORMAT_DEFAULT_FULL = 'YYYY-MM-DD hh:mm:ss',
    DATE_FORMAT_DEFAULT_ISO = 'YYYY-MM-DDTHH:mm:ssZ',

    /**
     * Parse date to Moment object
     * @param {*} date
     * @param {string|null} format
     * @returns {Moment}
     */
    parseDate = (date, format = null) => {
        return moment.utc(date, format);
    },

    /**
     * Return parsed date or DEFAULT_MIN_DATE
     * @param {*} date
     * @param {string|null} format
     * @param {Moment} defaultDate
     * @returns {Moment}
     */
    parseDateOrDefault = (date = null, format = null, defaultDate = DEFAULT_MIN_DATE) => {
        const dt = parseDate(date, format);
        return dt.isValid() ? dt : defaultDate;
    },

    /**
     * Get now
     * @returns {Moment}
     */
    getNow = () => {
        return moment.utc();
    },

    /**
     * Return yesterday
     * @returns {Moment}
     */
    getToday = () => {
        return moment.utc().startOf('day');
    },

    /**
     * Return yesterday
     * @returns {Moment}
     */
    getYesterday = () => {
        return moment.utc().startOf('day').subtract(1, 'days');
    },

    /**
     * Return parsed date or DEFAULT_MIN_DATE
     * @param {*} date
     * @param {string|null} format
     * @returns {Moment}
     */
    minDate = (date = null, format = null) => {
        const dt = parseDate(date, format);
        return dt.isValid() ? dt : DEFAULT_MIN_DATE;
    },

    /**
     * Return parsed date or DEFAULT_MAX_DATE
     * @param {*} date
     * @param {string|null} format
     * @returns {Moment}
     */
    maxDate = (date = null, format = null) => {
        const dt = parseDate(date, format);
        return dt.isValid() ? dt : DEFAULT_MAX_DATE;
    },

    /**
     * Return parsed date which is decreased down to 'YYYY-MM-DDT00:00:00.000'
     * @param {*} date
     * @param {string|null} format
     * @returns {Moment}
     */
    startOfDay = (date = null, format = null) => {
        const dt = parseDate(date, format);

        return dt.startOf('day');
    },

    /**
     * Return parsed date which is increased up to 'YYYY-MM-DDT23:59:59.999'
     * IMPORTANT: physically day end is equal next day and 00:00:00 time, we need to convert a day end to the same day
     * @param {*} date
     * @param {string|null} format
     * @returns {Moment}
     */
    endOfDay = (date = null, format = null) => {
        const DURATION = '23:59:59.999',
            dt = startOfDay(date, format);

        return dt.add(moment.duration(DURATION));
    },

    /**
     * Return calculated date of the first day of the month
     * @param {*} date
     * @param {string|null} format
     * @returns {Moment}
     */
    startOfMonth = (date, format = null) => {
        const dt = parseDate(date, format);

        return dt.startOf('month');
    },

    /**
     * Return calculated date of the last day of the month
     * @param {*} date
     * @param {string|null} format
     * @returns {Moment}
     */
    endOfMonth = (date, format = null) => {
        const dt = parseDate(date, format);

        return dt.endOf('month');
    },

    /**
     * Generator {Iterator.<Moment>} => {Iterator.<timestamp>}
     * @param {Array.<Moment>} dates
     * @private
     */
    datesToUnixtimestamp = function *(dates) {
        if (typeof dates[Symbol.iterator] === 'function') {
            for (const date of dates) {
                if (moment.isMoment(date)) {
                    yield +date;
                }
            }
        }
    },

    /**
     * Compare and return earliest date
     * @param {Array.<Moment>} dates
     * @returns {*}
     */
    compareMinDate = (...dates) => {
        const dt = Math.min(...datesToUnixtimestamp(dates));
        return moment.utc(dt);
    },

    /**
     * Compare and return latest date
     * @param {Array.<Moment>} dates
     * @returns {*}
     */
    compareMaxDate = (...dates) => {
        const dt = Math.max(...datesToUnixtimestamp(dates));
        return moment.utc(dt);
    },

    /**
     * Evaluate difference between two dates in minutes
     * @param {Moment} firstDate
     * @param {Moment} lastDate
     * @returns {number}
     */
    diffInMinutes = (firstDate, lastDate) => {
        const MEASUREMENT = 'minutes',
            WITHOUT_ROUNDING = true;

        return Math.ceil(lastDate.diff(firstDate, MEASUREMENT, WITHOUT_ROUNDING));
    },

    /**
     * Evaluate difference between two dates in full days
     * @param {Moment} firstDate
     * @param {Moment} lastDate
     * @returns {number}
     */
    diffInFullDays = (firstDate, lastDate) => {
        const MEASUREMENT = 'days';

        return Math.ceil(lastDate.diff(firstDate, MEASUREMENT));
    },

    /**
     * Return calculated date of the first day of the month
     * @param {Moment} firstDate
     * @param {Moment} lastDate
     * @returns {Array.<Moment>}
     */
    daysOfPeriod = (firstDate, lastDate) => {
        const MEASUREMENT = 'days';

        return Array.from(moment.range(firstDate, lastDate).by(MEASUREMENT));
    },

    /**
     * Calculate duration
     * @returns {function(): number}
     */
    calcDuration = () => {
        const start = new Date();

        return () => {
            const end = new Date();

            return end - start;
        };
    };
