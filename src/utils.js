/*!
 * Rbutr Browser Extension v0.12.0
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global browser,console,JSON,*/
/*exported RbutrUtils*/
/*jslint browser:true,esnext:true */


/**
 * @description Multi-Browser support
 */
window.browser = (() => {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();



/**
 * @method RbutrUtils
 * @description Class constructor with variable initialisation
 *
 * @return {Object} Public object methods
 */
const RbutrUtils = () => {

    'use strict';

    const devStorageKey = 'rbutr.isDev';



    /**
     * @method log
     * @description If developer mode is enabled, the passed parameters will be logged to the console. First parameter defines the log-level
     *
     * @param {String} logLevel - The level in which the message should be logged (log, debug, error, ...)
     * @param {...*} logParams - Variable amount of mixed parameters
     * @return {void}
     */
    const log = (logLevel, ...logParams) => {

        const MIN_PARAM_COUNT = 2;

        // Overwrite console to prevent eslint "no-console" errors
        const LOGGER = window.console;

        // Convert logParams object to array
        let params = Object.keys(logParams).map(index => logParams[index]);
        params.unshift('[rbutr] ');

        // only continue in Dev-Mode and if there are more than 1 log params
        if(isDev() && params.length >= MIN_PARAM_COUNT) {
            if(typeof LOGGER[logLevel] === 'function') {
                LOGGER[logLevel].apply(console, params);
            } else {
                LOGGER.error('console.' + logLevel + ' is not a valid logging function.');
                LOGGER.debug.apply(console, params);
            }
        }
    };



    /**
     * @method isDev
     * @description Determine, wether development mode is enabled or not
     *
     * @return {Boolean} Dev-Mode state
     */
    const isDev = () => {

        let isDev = localStorage.getItem(devStorageKey);

        if (!isDev) {
            isDev = 'false';
            localStorage.setItem(devStorageKey, isDev);
        }

        return isDev === 'true';
    };




    /**
     * @method url2Domain
     * @description Cleanup a url to get the domain out of it.
     *
     * @param {String} url - URL where domain should be extracted
     * @return {String} A domain
     */
    const url2Domain = (url) => {

        if (url) {
            return url.toString()
                .replace(/^(?:https?|ftp)\:\/\//i, '')
                .replace(/^www\./i, '')
                .replace(/\/.*/, '');
        }

        return url;
    };



    /**
     * @method getCanonicalUrl
     * @description Generate an absolute url (protocol, host, path) from a canonicalValue that might be relative
     *
     * @param {String} canonicalValue - URL that should be made absolute
     * @return {(String|Boolean)} Returns either the found URL or false
     */
    const getCanonicalUrl = (canonicalValue) => {

        if (canonicalValue) {
            if (canonicalValue.match('^[a-zA-Z]+://.*')) {
                // canonicalValue is a full url
                return canonicalValue;
            } else if (canonicalValue.match('^/.*')) {
                // canonicalValue is an absolute url in the current host
                return location.protocol + '//' + location.host + canonicalValue;
            } else {
                log('error', 'The canonical URL is relative and does not start with "/". Not supported.');
                return false;
            }
        } else {
            return false;
        }
    };



    /**
     * @method unicode2String
     * @description Convert Unicode escaped string to regular string, see http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
     *
     * @param {String} str - A string that may contain unicode characters
     * @return {String} Cleaned string
     */
    const unicode2String = (str) => {
        return decodeURIComponent(JSON.parse('"' + str.replace(/\"/g, '\\"') + '"'));
    };



    /**
     * @method updateExtBadge
     * @description Set Hover-Text on extension button
     *
     * @param {Integer} tabId - Current browser tab ID
     * @param {String} title - Text to be displayed on hover
     * @param {*} text - Text to be displayed in the badge
     * @param {String} color - An array containing RGBA values
     * @return {void}
     */
    const updateExtBadge = (tabId, title, text, color) => {

        const COLOR_VAL_ZERO  = 0;
        const COLOR_VAL_HALF  = 100;
        const COLOR_VAL_FULL  = 255;
        const COLOR = {
            red : [COLOR_VAL_FULL, COLOR_VAL_ZERO, COLOR_VAL_ZERO, COLOR_VAL_FULL],
            pink : [COLOR_VAL_FULL, COLOR_VAL_FULL, COLOR_VAL_ZERO, COLOR_VAL_FULL],
            rose : [COLOR_VAL_FULL, COLOR_VAL_HALF, COLOR_VAL_HALF, COLOR_VAL_FULL],
            transparent : [COLOR_VAL_ZERO, COLOR_VAL_ZERO, COLOR_VAL_ZERO, COLOR_VAL_ZERO]
        };

        browser.browserAction.setTitle({
            tabId: tabId,
            title: title,
        });

        browser.browserAction.setBadgeText({
            tabId: tabId,
            text: text.toString(),
        });

        browser.browserAction.setBadgeBackgroundColor({
            tabId: tabId,
            color: color === '' ? COLOR.transparent : COLOR[color],
        });
    };



    return {log, isDev, url2Domain, getCanonicalUrl, unicode2String, updateExtBadge};
};
