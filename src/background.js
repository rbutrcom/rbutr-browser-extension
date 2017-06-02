/*global browser,console,$,b64_md5,RbutrUtils*/
/*jslint browser:true,esnext:true */


/**
 * @description Multi-Browser support
 */
window.browser = (function () {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();



const rbutrUtils = RbutrUtils();



/**
 * @description Class constructor with variable initialisation
 *
 * @method Rbutr
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



    /**
     * @description Property getter
     *
     * @method getProp
     * @param {string} name
     * @param {mixed} key
     * @return {mixed}
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
     * @description Property setter
     *
     * @method setProp
     * @param {string} name
     * @param {mixed} key
     * @param {mixed} value
     * @return {void}
     */
    const setProp = (name, key, value) => {

        if (Array.isArray(properties[name])) {
            if (value === null) {
                properties[name].splice(key, 1);
            } else {
                properties[name][key] = value;
            }
        } else {
            properties[name] = value;
        }
    };



    /**
     * @description Get length of property array
     *
     * @method getPropLen
     * @param {string} name
     * @return {integer}
     */
    const getPropLen = (name) => {
        if (Array.isArray(properties[name])) {
            return Object.keys(properties[name]).length;
        } else {
            return properties[name].length;
        }
    };



    /**
     * @description Initialize rbutr
     *
     * @method initialize
     * @param {void}
     * @return {void}
     */
    const initialize = () => {

        rbutrUtils.log('log','rbutr initialised ', new Date());
    };



    /**
     * @description Get stored client id or generate and store a new one
     *
     * @method getCid
     * @param {void}
     * @return {integer}
     */
    const getCid = () => {

        const CID_KEY = 'rbutr.cid';
        let cid = localStorage.getItem(CID_KEY);
        if (!cid) {
            let ms = new Date().getTime();
            let rnd = Math.floor((Math.random() * 1000) + 1);
            cid = ms + ('0000' + rnd).slice(-4);
            localStorage.setItem(CID_KEY, cid);
        }
        return parseInt(cid, 10);
    };



    /**
     * @description Check if the given url already exist in property arrays
     *
     * @method alreadyExists
     * @param {string} url
     * @return {boolean}
     */
    const alreadyExists = (url) => {

        for (let i = 0; i < getPropLen('fromUrls'); i++) {
            if (getProp('fromUrls', i) == url) {
                return true;
            }
        }
        for (let j = 0; j < getPropLen('toUrls'); j++) {
            if (getProp('toUrls', j) == url) {
                return true;
            }
        }
        return false;
    };



    /**
     * @description Get page title for the given url
     *
     * @method getPageTitle
     * @param {string} url
     * @return {string}
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
     * @description Get currently displayed popup
     *
     * @method getPopup
     * @param {void}
     * @return {object}
     */
    const getPopup = () => {

        let popups = browser.extension.getViews({type: 'popup'});
        if (popups.length > 0) {
            return popups[0];
        } else {
            return null;
        }
    };



    /**
     * @description Display a message in the current popup
     *
     * @method displayMessage
     * @param {string} message
     * @return {void}
     */
    const displayMessage = (message) => {

        let popup = getPopup();

        if (popup === null) {
            rbutrUtils.log('error', 'Popup was null, couldn\'t display : ', message);
        } else {
            popup.displayMessage(message);
        }
    };



    /**
     * @description Post a message to content script to request an action
     *
     * @method postMessage
     * @param {integer} tabId
     * @param {string} action
     * @param {object} data
     * @return {void}
     */
    const postMessage = (action, data) => {

        // Get the current active tab in the lastly focused window
        browser.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, function (tab) {
            let $data = Object.assign({}, {rbutr: rbutr, action: action}, data);
            rbutrUtils.log('debug', tab[0]);
            browser.tabs.sendMessage(tab[0].id, $data, function (response) {
                rbutrUtils.log('debug', response);
            });
        });
    };



    /**
     * @description Get recordec click object by given toUrl
     *
     * @method getRecordedClickByToUrl
     * @param {string} toUrl
     * @return {object}
     */
    const getRecordedClickByToUrl = (toUrl) => {

        let recClicks = getProp('recordedClicks', toUrl);
        return recClicks ? recClicks : null;
    };



    /**
     * @description Load data on tab switch
     *
     * @method tabLoaded
     * @param {integer} tabId
     * @param {string} url
     * @return {void}
     */
    const tabLoaded = (tabId, url) => {

        setProp('rebuttals', tabId, null);
        let vote = false;
        let recordedClick = getRecordedClickByToUrl(getProp('canonicalUrls', tabId));
        // Don't show voting after you've voted
        if (recordedClick !== null && recordedClick.yourVote === 0) {
            vote = true;
        }


        $.get(rbutrUtils.getServerUrl(), {
            getLinks: true,
            fromPageUrlHash: b64_md5(url),
            version: browser.runtime.getManifest().version,
            cid: rbutr.getCid()
        }, function (data) {
            rbutr.setProp('rebuttals', tabId, data);
            rbutr.setProp('loggedIn', null, true);

            let m = rbutr.getProp('rebuttals', tabId).match(/id="notLoggedIn"/g);
            let titleMessage = '';

            if (m !== null && m.length > 0) {
                rbutr.setProp('loggedIn', null, false);
            }
            if (rbutr.getProp('rebuttals', tabId).indexOf('<h2 class="status">No Rebuttals</h2><br style="clear:left;">') != -1) {
                rbutr.setProp('rebuttalCount', tabId, 0);
                // No rebuttals
                browser.browserAction.setBadgeText({text: '', tabId: tabId});
                if (vote && rbutr.getProp('loggedIn')) {
                    browser.browserAction.setBadgeText({text: 'Vote', tabId: tabId});
                    browser.browserAction.setBadgeBackgroundColor({color: [255, 255, 0, 255], tabId: tabId});
                    titleMessage = 'You can vote on this.';
                    browser.browserAction.setTitle({tabId: tabId, title: titleMessage});
                    rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.getProp('canonicalUrls', tabId)});
                } else {
                    browser.browserAction.setTitle({
                        tabId: tabId,
                        title: 'RbutR - There are no rebuttals to this page, do you know of one?'
                    });
                }
            } else {
                let matches = rbutr.getProp('rebuttals', tabId).match(/class="thumbsUp"/g);
                let count = Number(matches === null ? 0 : matches.length).toString();
                rbutr.setProp('rebuttalCount', tabId, count);
                let rebuttal_plural = 'rebuttals';

                if (count == 1) {
                    rebuttal_plural = 'rebuttal';
                }

                if (vote && rbutr.getProp('loggedIn')) {
                    browser.browserAction.setBadgeText({text: 'V ' + count, tabId: tabId});
                    browser.browserAction.setBadgeBackgroundColor({color: [255, 100, 100, 255], tabId: tabId});
                    titleMessage = 'You can vote on this, and there is also ' + count + ' ' + rebuttal_plural + '.';
                    browser.browserAction.setTitle({tabId: tabId, title: titleMessage});
                } else {
                    browser.browserAction.setBadgeText({text: count, tabId: tabId});
                    browser.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255], tabId: tabId});
                    titleMessage = 'This page has ' + count + ' ' + rebuttal_plural + '.';
                    browser.browserAction.setTitle({tabId: tabId, title: titleMessage});
                }

                rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.getProp('canonicalUrls', tabId)});
            }
        }).error(function (msg) {
            rbutr.setProp('rebuttals', tabId, msg.responseText);
        });
    };



    /**
     * @description Submit rebuttal data to server
     *
     * @method submitRebuttals
     * @param {integer} tabId
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

        $.post(rbutrUtils.getServerUrl(), {
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
            cid: rbutr.getCid()
        }, function (data) {
            rbutrUtils.log('debug', 'success status ', data.status);
            rbutr.displayMessage('<b>' + data.result + '</b>');
            window.open(data.redirectUrl);
            rbutr.getPopup().cancelSubmission(); // Clear the data now that it's submitted.
            rbutr.tabLoaded(tabId, getProp('canonicalUrls', tabId)); // This will reload the for the tab, and set the badge.
        }, 'json').done(function (msg) {
            rbutrUtils.log('debug', 'done status ', msg.status);
        }).fail(function (msg, arg2, arg3) {
            rbutr.displayMessage('Failed to submit : ' + msg.responseText);
            rbutrUtils.log('debug', 'fail status ', msg.status);
            rbutrUtils.log('debug', 'msg = ', msg);
            rbutrUtils.log('debug', 'arg2 = ', arg2);
            rbutrUtils.log('debug', 'arg3 = ', arg3);
        });
    };



    /**
     * @description Prepare data submission
     *
     * @method startSubmission
     * @param {integer} tabId
     * @param {string} fromTo
     * @return {void}
     */
    const startSubmission = (tabId, fromTo) => {

        let canonUrlByTab = getProp('canonicalUrls', tabId);

        setProp('submittingRebuttal', true);

        if (fromTo == 'from') {
            setProp('fromUrls', 0, canonUrlByTab);
            // toUrl = 'Please navigate to the rebuttal page and select using above link';
        } else {
            setProp('toUrls', 0, canonUrlByTab);
            // fromUrl = 'Please navigate to the source page and select using above link';
        }
        setProp('comment', []);
        setProp('submitError', '');
        setProp('tags', []);
    };



    /**
     * @description Cleanup after data submission
     *
     * @method stopSubmission
     * @param {void}
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
     * @description Remove a tag from tag list
     *
     * @method removeTag
     * @param {string} tagText
     * @return {void}
     */
    const removeTag = (tagText) => {

        let index = getProp('tags').indexOf(tagText);
        setProp('tags', index, null);
    };



    /**
     * @description Add a tag to tag list
     *
     * @method addTag
     * @param {string} tagText
     * @return {void}
     */
    const addTag = (tagText) => {

        if (getPropLen('tags') >= 6) {
            return;
        } else {
            removeTag(tagText); // Avoid duplicates.
            setProp('tags', getPropLen('tags'), tagText);
        }
    };



    /**
     * @description Record click from rbutr website
     *
     * @method recordLinkClick
     * @param {object} clickData
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
     * @description Generate an absolute url (protocol, host, path) from a canonicalValue that might be relative
     *
     * @method getCanonicalUrl
     * @param {string} canonicalValue
     * @return {string}
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
                rbutrUtils.log('error', 'The canonical URL is relative and does not start with "/". Not supported.');
                return null;
            }
        } else {
            return null;
        }
    };


    return {getProp, setProp, getPropLen, initialize, getCid, alreadyExists, getPageTitle, getPopup, displayMessage, postMessage, getRecordedClickByToUrl, tabLoaded, submitRebuttals, startSubmission, stopSubmission, removeTag, addTag, recordLinkClick, getCanonicalUrl};
};



var rbutr = Rbutr();

document.addEventListener('DOMContentLoaded', function () {

    rbutr.initialize();


    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {

        'use strict';

        if (request.action) {
            if (request.action == 'setCanonical') {
                let tab = request.tab || sender.tab;
                let canonicalUrl = rbutr.getCanonicalUrl(tab.url);
                let url = canonicalUrl || tab.url;

                if (!/^http/.test(canonicalUrl)) {
                    return;
                }

                rbutr.setProp('urlIsCanonical', url, !!canonicalUrl);
                rbutr.setProp('canonicalUrls', tab.id, canonicalUrl);
                rbutr.setProp('plainUrls', tab.id, tab.url);

                rbutr.setProp('pageTitle', url, tab.title);
                rbutr.tabLoaded(tab.id, url);

            } else if (request.action == 'setClick') {
                let click = request.click;
                rbutr.recordLinkClick(click);
                rbutrUtils.log('debug', 'click recorded: ', click.linkToUrl);
            } else if (request.action == 'getCid') {
                sendResponse(rbutr.getCid());
                return true;
            } else if (request.action == 'getServerUrl') {
                sendResponse(rbutrUtils.getServerUrl());
                return true;
            } else if (request.action == 'getServerDomain') {
                sendResponse(rbutrUtils.getServerUrl(true));
                return true;
            } else if (request.action == 'getVersion') {
                sendResponse(browser.runtime.getManifest().version);
                return true;
            }
        }

    });



    // tab is going away, remove the canonical data for it
    browser.tabs.onRemoved.addListener(function (tabId) {

        'use strict';

        rbutr.setProp('canonicalUrls', tabId, null);
        rbutr.setProp('plainUrls', tabId, null);
    });



    /**
     * @description Fires when a tab is updated
     */
    browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

        'use strict';

        // ensure that the url data lives for the life of the page, not the tab
        if (changeInfo.status === 'loading') {
            if (tab.url == rbutr.getProp('plainUrls', tabId)) {
                return;
            }

            rbutr.setProp('canonicalUrls', tabId, null);
            rbutr.setProp('plainUrls', tabId, null);
        }
    });


});
