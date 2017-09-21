/*!
 * Rbutr Browser Extension v0.10.0
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global browser,b64_md5,RbutrUtils,RbutrApi*/
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

        // The to-be-rebutted URLs
        sourceUrls : [],
        // The rebuttal URLs
        rebuttalUrls : [],
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

        return result === undefined ? null : result;
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

        for (let i = 0; i < getPropLen('sourceUrls'); i++) {
            if (getProp('sourceUrls', i) === url) {
                return true;
            }
        }
        for (let j = 0; j < getPropLen('rebuttalUrls'); j++) {
            if (getProp('rebuttalUrls', j) === url) {
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
     * @param {String} type - The message type
     * @param {String} message - The message to be displayed
     * @return {void}
     */
    const displayMessage = (type, message) => {

        let popup = getPopup();

        if (popup === null) {
            utils.log('error', 'Popup was null, couldn\'t display:', message);
        } else {
            popup.msg.add(type, message);
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
     * @description Get recorded click object by given rebuttalUrl
     *
     * @param {String} rebuttalUrl - Rebuttal page URL
     * @return {?Object} Return click object for URL or null
     */
    const getRecordedClickByToUrl = (rebuttalUrl) => {

        let recClicks = getProp('recordedClicks', rebuttalUrl);
        return recClicks ? recClicks : null;
    };



    /**
     * @method getMenu
     * @description Submit rebuttal data to server
     *
     * @return {void}
     */
    const getMenu = () => {
        api.getMenu((success, result) => {
            if (success === true) {
                popupPort.postMessage({response: 'getMenu', status: 'success', result: result});
            } else {
                popupPort.postMessage({response: 'getMenu', status: 'error', result: `Menu could not be loaded: ${result}`});
            }
        });
    };



    /**
     * @method getRebuttals
     * @description Load rebuttal data via API
     *
     * @param {Number} tabId - Browser tab id
     * @param {String} url - Browser tab URL
     * @return {void}
     */
    const getRebuttals = (tabId, url) => {

        setProp('rebuttals', tabId, null);
        let canVote = false;
        let recordedClick = getRecordedClickByToUrl(getProp('canonicalUrls', tabId));
        // Don't show voting after you've voted
        if (recordedClick !== null && recordedClick.yourVote && recordedClick.yourVote === ZERO) {
            canVote = true;
        }


        api.getRebuttals(b64_md5(url), (success, result) => {
            if (success === true) {
                let titleMessage = '';

                const hasRebuttals = result.match(/No Rebuttals/g) === null;
                rbutr.setProp('loggedIn', null, result.match(/id="not-logged-in"/g) === null);
                rbutr.setProp('rebuttals', tabId, result);

                let matches = result.match(/class="thumbsUp"/g);
                let count = matches === null ? ZERO : matches.length;
                rbutr.setProp('rebuttalCount', tabId, count);

                if (hasRebuttals) {
                    if (canVote && rbutr.getProp('loggedIn')) {
                        titleMessage = `You can vote on this, and there are also ${count} rebuttal(s).`;
                        utils.updateExtBadge(tabId, titleMessage, 'V ' + count, 'rose');
                    } else {
                        titleMessage = `This page has ${count} rebuttal(s).`;
                        utils.updateExtBadge(tabId, titleMessage, count, 'red');
                    }

                    rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.getProp('canonicalUrls', tabId)});

                } else {
                    if (canVote && rbutr.getProp('loggedIn')) {
                        titleMessage = 'You can vote on this.';
                        utils.updateExtBadge(tabId, titleMessage, 'Vote', 'pink');
                        rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.getProp('canonicalUrls', tabId)});
                    } else {
                        titleMessage = 'RbutR - There are no rebuttals to this page, do you know of one?';
                        utils.updateExtBadge(tabId, titleMessage, '', '');
                    }
                }

                popupPort.postMessage({response: 'getRebuttals', status: 'success', result: result});

            } else {
                popupPort.postMessage({response: 'getRebuttals', status: 'error', result: `Rebuttals could not be loaded: ${result}`});
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

        let sourcePageTitles = [];
        let rebuttalPageTitles = [];
        let canonicalSourcePages = [];
        let canonicalRebuttalPages = [];

        for (let i = 0; i < getPropLen('rebuttalUrls'); i++) {
            rebuttalPageTitles[i] = getProp('pageTitle', getProp('rebuttalUrls', i));
            canonicalRebuttalPages[i] = getProp('urlIsCanonical', getProp('rebuttalUrls', i));
        }

        for (let j = 0; j < getPropLen('sourceUrls'); j++) {
            sourcePageTitles[j] = getProp('pageTitle', getProp('sourceUrls', j));
            canonicalSourcePages[j] = getProp('urlIsCanonical', getProp('sourceUrls', j));
        }

        const submitParameters = {
            fromUrls: getProp('sourceUrls'),
            toUrls: getProp('rebuttalUrls'),
            fromPageTitles: sourcePageTitles,
            toPageTitles: rebuttalPageTitles,
            comments: getProp('comment'),
            canonicalFromPages: canonicalSourcePages,
            canonicalToPages: canonicalRebuttalPages,
            direct: getProp('direct'),
            tags: getProp('tags'),
        };

        api.submitRebuttals(submitParameters, (success, result) => {
            if (success === true) {
                rbutr.getRebuttals(tabId, getProp('canonicalUrls', tabId)); // This will reload the data for the tab, and set the badge.
                popupPort.postMessage({response: 'submitRebuttals', status: 'success', result: result});
            } else {
                utils.log('error', 'Rebuttal could not be submitted:', result);
                popupPort.postMessage({response: 'submitRebuttals', status: 'error', result: `Rebuttal could not be submitted: ${result}`});
            }
        });
    };



    /**
     * @method submitIdea
     * @description Submit rebuttal data to server
     *
     * @param {Integer} tabId - ID of the popup's tab
     * @param {String} data - Value of the idea input in popup
     * @return {void}
     */
    const submitIdea = (tabId, data) => {
        const submitParameters = {
            url: getProp('canonicalUrls', tabId),
            title: getProp('pageTitle', getProp('canonicalUrls', tabId)),
            idea: data,
        };

        api.submitIdea(submitParameters, (success, result) => {
            if (success === true) {
                popupPort.postMessage({response: 'submitIdea', status: 'success', result: result});
            } else {
                popupPort.postMessage({response: 'submitIdea', status: 'error', result: `Idea could not be submitted: ${result}`});
            }
        });
    };



    /**
     * @method submitRebuttalRequest
     * @description Submit rebuttal request data to server
     *
     * @param {Integer} tabId - ID of the popup's tab
     * @return {void}
     */
    const submitRebuttalRequest = (tabId) => {

        const submitParameters = {
            subscribeToPage: getProp('canonicalUrls', tabId),
            title: getProp('pageTitle', getProp('canonicalUrls', tabId)),
            tags: getProp('tags'),
            pageIsCanonical: getProp('urlIsCanonical', getProp('canonicalUrls', tabId)),
        };

        api.submitRebuttalRequest(submitParameters, (success, result) => {
            if (success === true) {
                popupPort.postMessage({response: 'submitRebuttalRequest', status: 'success', result: result});
            } else {
                popupPort.postMessage({response: 'submitRebuttalRequest', status: 'error', result: `Rebuttal request could not be submitted: ${result}`});
            }
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
            setProp('sourceUrls', FIRST_ARRAY_ELEMENT, canonUrlByTab);
        } else if (fromTo === 'to') {
            setProp('rebuttalUrls', FIRST_ARRAY_ELEMENT, canonUrlByTab);
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
        setProp('sourceUrls', []);
        setProp('rebuttalUrls', []);
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


    return {utils, api, getProp, setProp, getPropLen, initialize, alreadyExists, getPageTitle, getPopup, displayMessage, postMessage, getRecordedClickByToUrl, getMenu, getRebuttals, submitRebuttals, submitIdea, submitRebuttalRequest, startSubmission, stopSubmission, removeTag, addTag, recordLinkClick};
};



// Necessary usage of 'var' because popup will not get variable if it's 'const' or 'let' in Chrome
var rbutr = Rbutr();
let popupPort = null;


document.addEventListener('DOMContentLoaded', () => {

    rbutr.initialize();


    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {

        'use strict';

        if (request.action) {

            let tab = request.tab || sender.tab;
            let canonicalUrl = rbutr.utils.getCanonicalUrl(tab.url);
            let url = canonicalUrl || tab.url;

            if (request.action === 'setCanonical') {

                if (!/^http/.test(canonicalUrl)) {
                    return;
                }

                rbutr.setProp('urlIsCanonical', url, Boolean(canonicalUrl));
                rbutr.setProp('canonicalUrls', tab.id, canonicalUrl);
                rbutr.setProp('plainUrls', tab.id, tab.url);

                rbutr.setProp('pageTitle', url, tab.title);
                return true;

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



    browser.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener((msg) => {
            if (port.name === 'popup-background') {
                popupPort = port;

                if (msg.request === 'getRebuttals') {
                    let canonicalUrl = rbutr.utils.getCanonicalUrl(msg.tab.url);
                    let url = canonicalUrl || msg.tab.url;
                    rbutr.getRebuttals(msg.tab.id, url);
                } else if (msg.request === 'getMenu') {
                    rbutr.getMenu();
                } else if (msg.request === 'submitIdea') {
                    rbutr.submitIdea(msg.tab.id, msg.data);
                } else if (msg.request === 'submitRebuttalRequest') {
                    rbutr.submitRebuttalRequest(msg.tab.id, msg.data);
                }
            }
        });
    });

});
