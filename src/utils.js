/*global console,JSON,*/
/*jslint browser:true,esnext:true */



/**
 * @description Class constructor with variable initialisation
 *
 * @method RbutrUtils
 * @param {void}
 * @return {object}
 */
const RbutrUtils = () => {

    'use strict';

    const devStorageKey = 'rbutr.isDev';
    const logPrefix = '[rbutr] ';
    const devDomain = 'https://russell.rbutr.com';
    const liveDomain = 'http://rbutr.com';



    /**
     * @description If developer mode is enabled, the passed parameters will be logged to the console. First parameter defines the log-level
     *
     * @method log
     * @param {mixed}
     * @return {void}
     */
    const log = (logLevel, ...logParams) => {

        // only continue in Dev-Mode and if there are more than 1 log params
        if(isDev() && logParams.length > 0) {
            if(typeof console[logLevel] === 'function') {
                console[logLevel](logPrefix + logParams.join(''));
            } else {
                console.error(logPrefix + 'console.' + logLevel + ' is not a valid logging function.');
                console.debug(logPrefix + logParams.join(''));
            }
        }
    };



    /**
     * @description Determine, wether development mode is enabled or not
     *
     * @method isDev
     * @param {void}
     * @return {boolean}
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
     * @description Get server url or just domain
     *
     * @method isDev
     * @param {boolean} domainOnly
     * @return {string}
     */
    const getServerUrl = (domainOnly) => {

        let
            domain = isDev() ? devDomain : liveDomain,
            apiPath = domainOnly === true ? '' : '/rbutr/PluginServlet';

        return domain + apiPath;
    };




    /**
     * @description Cleanup a url to get the domain out of it.
     *
     * @method url2Domain
     * @param {string} url
     * @return {string}
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
     * @description Convert Unicode escaped string to regular string, see http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
     *
     * @method unicode2String
     * @param {string} str
     * @return {string}
     */
    const unicode2String = (str) => {
        return decodeURIComponent(JSON.parse('"' + str.replace(/\"/g, '\\"') + '"'));
    };

    return {log, isDev, getServerUrl, url2Domain, unicode2String};
};
