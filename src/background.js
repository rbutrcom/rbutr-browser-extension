/*!
 * Rbutr Browser Extension v0.10.0
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global browser,console,$,b64_md5,RbutrUtils,RbutrApi*/
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
 * @method Rbutr
 * @description Class constructor with variable initialisation
 *
 * @return {Object} Public object methods
 */
const Rbutr = () => {

    'use strict';

    let properties = {

        fromUrls : [],
        toUrls : [],
        comment : [],
        tags : [],
        recordedClicks : [],
        // Keyed by tabId
        rebuttals : [],
        // Keyed by tabId
        rebuttalCount : [],
        canonicalUrls : [],
        plainUrls : [],
        urlIsCanonical : [],
        pageTitle : [],
        submittingRebuttal : false,
        loggedIn : false,
        submitError : '',
        direct : false
    };

    const ZERO = 0;
    const FIRST_ARRAY_ELEMENT = 0;

    const COLOR_VAL_ZERO  = 0;
    const COLOR_VAL_HALF  = 100;
    const COLOR_VAL_FULL  = 255;
    const COLOR_RED       = [COLOR_VAL_FULL, COLOR_VAL_ZERO, COLOR_VAL_ZERO, COLOR_VAL_FULL];
    const COLOR_MAGENTA   = [COLOR_VAL_FULL, COLOR_VAL_FULL, COLOR_VAL_ZERO, COLOR_VAL_FULL];
    const COLOR_LIGHT_RED = [COLOR_VAL_FULL, COLOR_VAL_HALF, COLOR_VAL_HALF, COLOR_VAL_FULL];




    /**
     * @property utils
     * @description Composing RbutrUtils object into Rbutr for easier usage
     *
     * @type {Object} RbutrUtils object
     */
    const utils = RbutrUtils();

    /**
     * @property api
     * @description Composing RbutrApi object into Rbutr for easier usage
     *
     * @type {Object} RbutrApi object
     */
    const api = RbutrApi(utils);



    /**
     * @method getProp
     * @description Property getter
     *
     * @param {String} name - Object name in variable "properties"
     * @param {(Number|String)} key - The key of an element in "properties.<name>"
     * @return {*} Property value
     */
    const getProp = (name, key) => {
        let result = null;

        if (Array.isArray(properties[name])) {
            result = key !== null && key !== undefined ? properties[name][key]: properties[name];
        } else {
            result = properties[name];
        }

        return result;
    };



    /**
     * @method setProp
     * @description Property setter; If value = null, delete element;
     *
     * @param {String} name - Object name in variable "properties"
     * @param {(Number|String)} key - The key of an element in "properties.<name>"
     * @param {*} value - The value to be set in "properties.<name>"
     * @return {void}
     */
    const setProp = (name, key, value) => {

        const DELETE_ELEMENT_COUNT = 1;

        if (Array.isArray(properties[name])) {
            if (value === null) {
                properties[name].splice(key, DELETE_ELEMENT_COUNT);
            } else {
                properties[name][key] = value;
            }
        } else {
            properties[name] = value;
        }
    };



    /**
     * @method getPropLen
     * @description Get length of property array
     *
     * @param {String} name - Object name in variable "properties"
     * @return {Number} Length of selected array or string
     */
    const getPropLen = (name) => {
        if (Array.isArray(properties[name])) {
            return Object.keys(properties[name]).length;
        } else {
            return properties[name].length;
        }
    };



    /**
     * @method initialize
     * @description Initialize rbutr
     *
     * @return {void}
     */
    const initialize = () => {

        utils.log('log','Initialised on', new Date());
    };



    /**
     * @method alreadyExists
     * @description Check if given url already exists in property arrays
     *
     * @param {String} url - URL to be checked
     * @return {Boolean} State of url existence
     */
    const alreadyExists = (url) => {

        for (let i = 0; i < getPropLen('fromUrls'); i++) {
            if (getProp('fromUrls', i) === url) {
                return true;
            }
        }
        for (let j = 0; j < getPropLen('toUrls'); j++) {
            if (getProp('toUrls', j) === url) {
                return true;
            }
        }
        return false;
    };



    /**
     * @method getPageTitle
     * @description Get page title for the given url
     *
     * @param {String} url - URL to get the title from
     * @return {String} A website title
     */
    const getPageTitle = (url) => {

        let pageTitle = getProp('pageTitle', url);
        if (pageTitle) {
            return pageTitle;
        } else {
            return 'No title';
        }
    };



    /**
     * @method getPopup
     * @description Get currently displayed popup
     *
     * @return {?Object} Returns a view object or null
     */
    const getPopup = () => {

        let popups = browser.extension.getViews({type: 'popup'});
        if (popups.length >= ZERO) {
            return popups[FIRST_ARRAY_ELEMENT];
        } else {
            return null;
        }
    };



    /**
     * @method displayMessage
     * @description Display a message in the popup
     *
     * @param {String} message - The message to be displayed
     * @return {void}
     */
    const displayMessage = (message) => {

        let popup = getPopup();

        if (popup === null) {
            utils.log('error', 'Popup was null, couldn\'t display:', message);
        } else {
            popup.displayMessage(message);
        }
    };



    /**
     * @method postMessage
     * @description Post a message to content script to request an action
     *
     * @param {String} action - Action to be executed in contentScript
     * @param {Object} data - Date to be send
     * @return {void}
     */
    const postMessage = (action, data) => {

        // Get the current active tab in the lastly focused window
        browser.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, (tab) => {
            let $data = Object.assign({}, {rbutr: rbutr, action: action}, data);

            utils.log('debug', 'Active tab:', tab[FIRST_ARRAY_ELEMENT]);
            browser.tabs.sendMessage(tab[FIRST_ARRAY_ELEMENT].id, $data);
        });
    };



    /**
     * @method getRecordedClickByToUrl
     * @description Get recorded click object by given toUrl
     *
     * @param {String} toUrl - Rebuttal page URL
     * @return {?Object} Return click object for URL or null
     */
    const getRecordedClickByToUrl = (toUrl) => {

        let recClicks = getProp('recordedClicks', toUrl);
        return recClicks ? recClicks : null;
    };



    /**
     * @method tabLoaded
     * @description Load data on tab switch
     *
     * @param {Number} tabId - Browser tab id
     * @param {String} url - Browser tab URL
     * @return {void}
     */
    const tabLoaded = (tabId, url) => {

        setProp('rebuttals', tabId, null);
        let canVote = false;
        let recordedClick = getRecordedClickByToUrl(getProp('canonicalUrls', tabId));
        // Don't show voting after you've voted
        if (recordedClick !== null && recordedClick.yourVote && recordedClick.yourVote === ZERO) {
            canVote = true;
        }


        rbutr.api.getRebuttals(b64_md5(url), (success, result) => {
            if (success === true) {
                let titleMessage = '';

                const hasRebuttals = result.match(/No Rebuttals/g) === null;
                const isLoggedIn = result.match(/id="not-logged-in"/g) === null;
                rbutr.setProp('loggedIn', null, isLoggedIn);

                rbutr.setProp('rebuttals', tabId, result);

                if (hasRebuttals) {
                    let matches = result.match(/class="thumbsUp"/g);
                    let count = matches === null ? ZERO : matches.length;
                    rbutr.setProp('rebuttalCount', tabId, count);

                    if (canVote && isLoggedIn) {
                        titleMessage = `You can vote on this, and there are also ${count} rebuttal(s).`;
                        utils.setExtTitle(tabId, titleMessage);
                        utils.setExtBadgeText(tabId, 'V ' + count);
                        utils.setExtBadgeBg(tabId, COLOR_LIGHT_RED);
                    } else {
                        titleMessage = `This page has ${count} rebuttal(s).`;
                        utils.setExtTitle(tabId, titleMessage);
                        utils.setExtBadgeText(tabId, count);
                        utils.setExtBadgeBg(tabId, COLOR_RED);
                    }

                    rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.getProp('canonicalUrls', tabId)});

                } else {
                    rbutr.setProp('rebuttalCount', tabId, ZERO);

                    if (canVote && isLoggedIn) {
                        titleMessage = 'You can vote on this.';
                        utils.setExtTitle(tabId, titleMessage);
                        utils.setExtBadgeText(tabId, 'Vote');
                        utils.setExtBadgeBg(tabId, COLOR_MAGENTA);
                        rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.getProp('canonicalUrls', tabId)});
                    } else {
                        utils.setExtBadgeText(tabId, '');
                        utils.setExtTitle(tabId, 'RbutR - There are no rebuttals to this page, do you know of one?');
                    }
                }
            } else {
                getPopup().msg.add('error', result);
            }
        });
    };



    /**
     * @method submitRebuttals
     * @description Submit rebuttal data to server
     *
     * @param {Number} tabId - Browser tab id
     * @return {void}
     */
    const submitRebuttals = (tabId) => {

        let fromPageTitles = [];
        let toPageTitles = [];
        let canonicalFromPages = [];
        let canonicalToPages = [];

        for (let i = 0; i < getPropLen('toUrls'); i++) {
            toPageTitles[i] = getProp('pageTitle', getProp('toUrls', i));
            canonicalToPages[i] = getProp('urlIsCanonical', getProp('toUrls', i));
        }

        for (let j = 0; j < getPropLen('fromUrls'); j++) {
            fromPageTitles[j] = getProp('pageTitle', getProp('fromUrls', j));
            canonicalFromPages[j] = getProp('urlIsCanonical', getProp('fromUrls', j));
        }

        $.post(api.getServerUrl(), {
            submitLinks: true,
            fromUrls: getProp('fromUrls'),
            toUrls: getProp('toUrls'),
            fromPageTitles: fromPageTitles,
            toPageTitles: toPageTitles,
            comments: getProp('comment'),
            canonicalFromPages: canonicalFromPages,
            canonicalToPages: canonicalToPages,
            direct: getProp('direct'),
            tags: getProp('tags'),
            cid: api.getCid()
        }, (data) => {
            utils.log('debug', 'Submit rebuttal success:', data.status);
            rbutr.displayMessage('<strong>' + data.result + '</strong>');
            window.open(data.redirectUrl);
            rbutr.getPopup().cancelSubmission(); // Clear the data now that it's submitted.
            rbutr.tabLoaded(tabId, getProp('canonicalUrls', tabId)); // This will reload the data for the tab, and set the badge.
        }, 'json').done((msg) => {
            utils.log('debug', 'Submit rebuttal done:', msg.status);
        }).fail((msg) => {
            rbutr.displayMessage('Failed to submit : ' + msg.responseText);
            utils.log('debug', 'Submit rebuttal fail:', msg);
        });
    };



    /**
     * @method startSubmission
     * @description Prepare data submission
     *
     * @param {Number} tabId - Browser tab id
     * @param {String} fromTo - Type of URLs that should be submitted
     * @return {void}
     */
    const startSubmission = (tabId, fromTo) => {

        let canonUrlByTab = getProp('canonicalUrls', tabId);

        setProp('submittingRebuttal', true);

        if (fromTo === 'from') {
            setProp('fromUrls', FIRST_ARRAY_ELEMENT, canonUrlByTab);
            // toUrl = 'Please navigate to the rebuttal page and select using above link';
        } else if (fromTo === 'to') {
            setProp('toUrls', FIRST_ARRAY_ELEMENT, canonUrlByTab);
            // fromUrl = 'Please navigate to the source page and select using above link';
        }

        setProp('comment', []);
        setProp('submitError', '');
        setProp('tags', []);
    };



    /**
     * @method stopSubmission
     * @description Cleanup after data submission
     *
     * @return {void}
     */
    const stopSubmission = () => {

        setProp('submittingRebuttal', false);
        setProp('fromUrls', []);
        setProp('toUrls', []);
        setProp('comment', []);
        setProp('tags', []);
    };



    /**
     * @method removeTag
     * @description Remove a tag from tag list
     *
     * @param {String} tagText - Content of the tag
     * @return {void}
     */
    const removeTag = (tagText) => {

        let index = getProp('tags').indexOf(tagText);
        setProp('tags', index, null);
    };



    /**
     * @method addTag
     * @description Add a tag to tag list
     *
     * @param {String} tagText - Content of the tag
     * @return {void}
     */
    const addTag = (tagText) => {

        const MAX_TAG_COUNT = 6;

        if (getPropLen('tags') >= MAX_TAG_COUNT) {
            return;
        } else {
            removeTag(tagText); // Avoid duplicates.
            setProp('tags', getPropLen('tags'), tagText);
        }
    };



    /**
     * @method recordLinkClick
     * @description Record click from rbutr website
     *
     * @param {Object} clickData - Click event data
     * @return {void}
     */
    const recordLinkClick = (clickData) => {

        let data = {
            fromTabId: null,
            linkId: clickData.linkId,
            linkFromUrl: clickData.linkFromUrl,
            linkToUrl: clickData.linkToUrl,
            score: clickData.score,
            yourVote: clickData.yourVote
        };

        setProp('recordedClicks', clickData.linkToUrl, data);
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
                utils.log('error', 'The canonical URL is relative and does not start with "/". Not supported.');
                return false;
            }
        } else {
            return false;
        }
    };


    return {utils, api, getProp, setProp, getPropLen, initialize, alreadyExists, getPageTitle, getPopup, displayMessage, postMessage, getRecordedClickByToUrl, tabLoaded, submitRebuttals, startSubmission, stopSubmission, removeTag, addTag, recordLinkClick, getCanonicalUrl};
};



// Necessary usage of 'var' because popup will not get variable if it's 'const' or 'let' in Chrome
var rbutr = Rbutr();


document.addEventListener('DOMContentLoaded', () => {

    rbutr.initialize();


    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {

        'use strict';

        if (request.action) {
            if (request.action === 'setCanonical') {
                let tab = request.tab || sender.tab;
                let canonicalUrl = rbutr.getCanonicalUrl(tab.url);
                let url = canonicalUrl || tab.url;

                if (!/^http/.test(canonicalUrl)) {
                    return;
                }

                rbutr.setProp('urlIsCanonical', url, Boolean(canonicalUrl));
                rbutr.setProp('canonicalUrls', tab.id, canonicalUrl);
                rbutr.setProp('plainUrls', tab.id, tab.url);

                rbutr.setProp('pageTitle', url, tab.title);
                rbutr.tabLoaded(tab.id, url);

            } else if (request.action === 'setClick') {
                let click = request.click;
                rbutr.recordLinkClick(click);
                rbutr.utils.log('debug', 'Click recorded:', click.linkToUrl);
            } else if (request.action === 'getCid') {
                sendResponse(rbutr.api.getCid());
                return true;
            } else if (request.action === 'getServerUrl') {
                sendResponse(rbutr.api.getServerUrl());
                return true;
            } else if (request.action === 'getServerDomain') {
                sendResponse(rbutr.api.getServerUrl(true));
                return true;
            } else if (request.action === 'getVersion') {
                sendResponse(browser.runtime.getManifest().version);
                return true;
            }
        }

    });



    // tab is going away, remove the canonical data for it
    browser.tabs.onRemoved.addListener((tabId) => {

        'use strict';

        rbutr.setProp('canonicalUrls', tabId, null);
        rbutr.setProp('plainUrls', tabId, null);
    });



    /**
     * @description Fires when a tab is updated
     */
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

        'use strict';

        // ensure that the url data lives for the life of the page, not the tab
        if (changeInfo.status === 'loading') {
            if (tab.url === rbutr.getProp('plainUrls', tabId)) {
                return;
            }

            rbutr.setProp('canonicalUrls', tabId, null);
            rbutr.setProp('plainUrls', tabId, null);
        }
    });


});
