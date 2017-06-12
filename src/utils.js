/*!
 * Rbutr Browser Extension v0.9.7
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global console,JSON,*/
/*exported RbutrUtils*/
/*jslint browser:true,esnext:true */



/**
 * @method RbutrUtils
 * @description Class constructor with variable initialisation
 *
 * @return {Object} Public object methods
 */
const RbutrUtils = () => {

    'use strict';

    const devStorageKey = 'rbutr.isDev';
    const devDomain = 'https://russell.rbutr.com';
    const liveDomain = 'http://rbutr.com';



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
     * @method getServerUrl
     * @description Get server url or just domain
     *
     * @param {Boolean} domainOnly - Flag to control if API URL or only domain will be returned
     * @return {String} URL of the server, may contain only domain
     */
    const getServerUrl = (domainOnly) => {

        let
            domain = isDev() ? devDomain : liveDomain,
            apiPath = domainOnly === true ? '' : '/rbutr/PluginServlet';

        return domain + apiPath;
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
     * @method unicode2String
     * @description Convert Unicode escaped string to regular string, see http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
     *
     * @param {String} str - A string that may contain unicode characters
     * @return {String} Cleaned string
     */
    const unicode2String = (str) => {
        return decodeURIComponent(JSON.parse('"' + str.replace(/\"/g, '\\"') + '"'));
    };



    return {log, isDev, getServerUrl, url2Domain, unicode2String};
};
