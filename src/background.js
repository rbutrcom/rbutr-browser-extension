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



const rbutrUtils = new RbutrUtils();



/**
 * @description Class constructor with variable initialisation
 *
 * @method Rbutr
 */
function Rbutr() {

    'use strict';

    this.submittingRebuttal = false;
    this.fromUrls = [];
    this.toUrls = [];
    this.comment = [];
    this.tags = [];
    this.loggedIn = false;
    this.submitError = '';
    this.direct = false;
    this.recordedClicks = {};

    // Keyed by tabId
    this.rebuttals = {};
    // Keyed by tabId
    this.rebuttalCount = {};

    this.canonical_urls = {};
    this.plain_urls = {};
    this.url_is_canonical = {};
    this.page_title = {};

    this.simpleAbsoluteUrlMatch = '^[a-zA-Z]+://.*';

    return this;
}



Rbutr.prototype = {

    constructor: Rbutr,



    /**
     * @description Initialize rbutr
     *
     * @method initialize
     * @param {void}
     * @return {void}
     */
    initialize: function () {

        'use strict';

        rbutrUtils.log('log','rbutr initialised ', new Date());
    },



    /**
     * @description Get stored client id or generate and store a new one
     *
     * @method getCid
     * @param {void}
     * @return {string}
     */
    getCid: function () {

        'use strict';

        var CID_KEY = 'rbutr.cid';
        var cid = localStorage.getItem(CID_KEY);
        if (!cid) {
            var ms = new Date().getTime();
            var rnd = Math.floor((Math.random() * 1000) + 1);
            cid = ms + ('0000' + rnd).slice(-4);
            localStorage.setItem(CID_KEY, cid);
        }
        return cid;
    },



    /**
     * @description Check if the given url already exist in property arrays
     *
     * @method alreadyExists
     * @param {string} url
     * @return {boolean}
     */
    alreadyExists: function (url) {

        'use strict';

        for (var i = 0; i < this.fromUrls.length; i++) {
            if (this.fromUrls[i] == url) {
                return true;
            }
        }
        for (var j = 0; j < this.toUrls.length; j++) {
            if (this.toUrls[j] == url) {
                return true;
            }
        }
        return false;
    },



    /**
     * @description Get page title for the given url
     *
     * @method getPageTitle
     * @param {string} url
     * @return {string}
     */
    getPageTitle: function (url) {

        'use strict';

        if (this.page_title[url]) {
            return this.page_title[url];
        } else {
            return 'No title';
        }
    },



    /**
     * @description Get currently displayed popup
     *
     * @method getPopup
     * @param {void}
     * @return {object}
     */
    getPopup: function () {

        'use strict';

        var popups = browser.extension.getViews({type: 'popup'});
        if (popups.length > 0) {
            return popups[0];
        } else {
            return null;
        }
    },



    /**
     * @description Display a message in the current popup
     *
     * @method displayMessage
     * @param {string} message
     * @return {void}
     */
    displayMessage: function (message) {

        'use strict';

        var popup = this.getPopup();

        if (popup === null) {
            rbutrUtils.log('error', 'Popup was null, couldn\'t display : ', message);
        } else {
            popup.displayMessage(message);
        }
    },



    /**
     * @description Post a message to content script to request an action
     *
     * @method postMessage
     * @param {integer} tabId
     * @param {string} action
     * @param {object} data
     * @return {void}
     */
    postMessage: function (action, data) {

        'use strict';

        // Get the current active tab in the lastly focused window
        browser.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, function (tab) {
            var $data = Object.assign({}, {rbutr: rbutr, action: action}, data);
            rbutrUtils.log('debug', tab[0]);
            browser.tabs.sendMessage(tab[0].id, $data, function (response) {
                rbutrUtils.log('debug', response);
            });
        });
    },



    /**
     * @description Get recordec click object by given toUrl
     *
     * @method getRecordedClickByToUrl
     * @param {string} toUrl
     * @return {object}
     */
    getRecordedClickByToUrl: function (toUrl) {

        'use strict';

        return this.recordedClicks[toUrl] ? this.recordedClicks[toUrl] : null;
    },



    /**
     * @description Load data on tab switch
     *
     * @method tabLoaded
     * @param {integer} tabId
     * @param {string} url
     * @return {void}
     */
    tabLoaded: function (tabId, url) {

        'use strict';

        this.rebuttals[tabId] = null;
        var vote = false;
        var recordedClick = this.getRecordedClickByToUrl(this.canonical_urls[tabId]);
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
            rbutr.rebuttals[tabId] = data;
            rbutr.loggedIn = true;
            var m = rbutr.rebuttals[tabId].match(/id="notLoggedIn"/g);
            if (m !== null && m.length > 0) {
                rbutr.loggedIn = false;
            }
            var titleMessage;
            if (rbutr.rebuttals[tabId].indexOf('<h2 class="status">No Rebuttals</h2><br style="clear:left;">') != -1) {
                rbutr.rebuttalCount[tabId] = 0;
                // No rebuttals
                browser.browserAction.setBadgeText({text: '', tabId: tabId});
                if (vote && rbutr.loggedIn) {
                    browser.browserAction.setBadgeText({text: 'Vote', tabId: tabId});
                    browser.browserAction.setBadgeBackgroundColor({color: [255, 255, 0, 255], tabId: tabId});
                    titleMessage = 'You can vote on this.';
                    browser.browserAction.setTitle({tabId: tabId, title: titleMessage});
                    rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.canonical_urls[tabId]});
                } else {
                    browser.browserAction.setTitle({
                        tabId: tabId,
                        title: 'RbutR - There are no rebuttals to this page, do you know of one?'
                    });
                }
            } else {
                var matches = rbutr.rebuttals[tabId].match(/class="thumbsUp"/g);
                var count = Number(matches === null ? 0 : matches.length).toString();
                rbutr.rebuttalCount[tabId] = count;
                var rebuttal_plural = 'rebuttals';

                if (count == 1) {
                    rebuttal_plural = 'rebuttal';
                }

                if (vote && rbutr.loggedIn) {
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

                rbutr.postMessage('showMessageBox', {message: titleMessage, url: rbutr.canonical_urls[tabId]});
            }
        }).error(function (msg) {
            rbutr.rebuttals[tabId] = msg.responseText;
        });
    },



    /**
     * @description Submit rebuttal data to server
     *
     * @method submitRebuttals
     * @param {integer} tabId
     * @return {void}
     */
    submitRebuttals: function (tabId) {

        'use strict';

        var fromPageTitles = [];
        var toPageTitles = [];
        var canonicalFromPages = [];
        var canonicalToPages = [];

        for (var i = 0; i < this.toUrls.length; i++) {
            toPageTitles[i] = this.page_title[this.toUrls[i]];
            canonicalToPages[i] = this.url_is_canonical[this.toUrls[i]];
        }

        for (var j = 0; j < this.fromUrls.length; j++) {
            fromPageTitles[j] = this.page_title[this.fromUrls[j]];
            canonicalFromPages[j] = this.url_is_canonical[this.fromUrls[j]];
        }

        $.post(rbutrUtils.getServerUrl(), {
            submitLinks: true,
            fromUrls: rbutr.fromUrls,
            toUrls: rbutr.toUrls,
            fromPageTitles: fromPageTitles,
            toPageTitles: toPageTitles,
            comments: rbutr.comment,
            canonicalFromPages: canonicalFromPages,
            canonicalToPages: canonicalToPages,
            direct: rbutr.direct,
            tags: rbutr.tags,
            cid: rbutr.getCid()
        }, function (data) {
            rbutrUtils.log('debug', 'success status ', data.status);
            rbutr.displayMessage('<b>' + data.result + '</b>');
            window.open(data.redirectUrl);
            rbutr.getPopup().cancelSubmission(); // Clear the data now that it's submitted.
            rbutr.tabLoaded(tabId, rbutr.canonical_urls[tabId]); // This will reload the for the tab, and set the badge.
        }, 'json').done(function (msg) {
            rbutrUtils.log('debug', 'done status ', msg.status);
        }).fail(function (msg, arg2, arg3) {
            rbutr.displayMessage('Failed to submit : ' + msg.responseText);
            rbutrUtils.log('debug', 'fail status ', msg.status);
            rbutrUtils.log('debug', 'msg = ', msg);
            rbutrUtils.log('debug', 'arg2 = ', arg2);
            rbutrUtils.log('debug', 'arg3 = ', arg3);
        });
    },



    /**
     * @description Prepare data submission
     *
     * @method startSubmission
     * @param {integer} tabId
     * @param {string} fromTo
     * @return {void}
     */
    startSubmission: function (tabId, fromTo) {

        'use strict';

        this.submittingRebuttal = true;
        if (fromTo == 'from') {
            this.fromUrls[0] = this.canonical_urls[tabId];
            // toUrl = 'Please navigate to the rebuttal page and select using above link';
        } else {
            this.toUrls[0] = this.canonical_urls[tabId];
            // fromUrl = 'Please navigate to the source page and select using above link';
        }
        this.comment = [];
        this.submitError = '';
        this.tags = [];
    },



    /**
     * @description Cleanup after data submission
     *
     * @method stopSubmission
     * @param {void}
     * @return {void}
     */
    stopSubmission: function () {

        'use strict';

        this.submittingRebuttal = false;
        this.fromUrls = [];
        this.toUrls = [];
        this.comment = [];
        this.tags = [];
    },



    /**
     * @description Remove a tag from tag list
     *
     * @method removeTag
     * @param {string} tagText
     * @return {void}
     */
    removeTag: function (tagText) {

        'use strict';

        var index = this.tags.indexOf(tagText);
        if (index >= 0) {
            this.tags.splice(index, 1);
        }
    },



    /**
     * @description Add a tag to tag list
     *
     * @method addTag
     * @param {string} tagText
     * @return {void}
     */
    addTag: function (tagText) {

        'use strict';

        if (this.tags.length >= 6) {
            return;
        }
        this.removeTag(tagText); // Avoid duplicates.
        this.tags[this.tags.length] = tagText;
    },



    /**
     * @description Record click from rbutr website
     *
     * @method recordLinkClick
     * @param {string} fromTabId
     * @param {string} linkId
     * @param {string} linkFromUrl
     * @param {string} linkToUrl
     * @param {float} score
     * @param {integer} yourVote
     * @return {void}
     */
    recordLinkClick: function (fromTabId, linkId, linkFromUrl, linkToUrl, score, yourVote) {

        'use strict';

        this.recordedClicks[linkToUrl] = {
            fromTabId: fromTabId,
            linkId: linkId,
            linkFromUrl: linkFromUrl,
            linkToUrl: linkToUrl,
            score: score,
            yourVote: yourVote
        };
    },



    /**
     * @description Generate an absolute url (protocol, host, path) from a canonicalValue that might be relative
     *
     * @method getCanonicalUrl
     * @param {string} canonicalValue
     * @return {string}
     */
    getCanonicalUrl: function (canonicalValue) {

        'use strict';

        if (canonicalValue) {
            if (canonicalValue.match(this.simpleAbsoluteUrlMatch)) {
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
    }
};


var rbutr = new Rbutr();

document.addEventListener('DOMContentLoaded', function () {

    rbutr.initialize();


    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {

        'use strict';

        if (request.action) {
            if (request.action == 'setCanonical') {
                var tab = request.tab || sender.tab;
                var canonicalUrl = rbutr.getCanonicalUrl(tab.url);
                var url = canonicalUrl || tab.url;

                if (!/^http/.test(canonicalUrl)) {
                    return;
                }

                rbutr.url_is_canonical[url] = !!canonicalUrl;
                rbutr.canonical_urls[tab.id] = canonicalUrl;
                rbutr.plain_urls[tab.id] = tab.url;

                rbutr.page_title[url] = tab.title;
                rbutr.tabLoaded(tab.id, url);

            } else if (request.action == 'setClick') {
                var click = request.click;
                rbutr.recordLinkClick(null, click.linkId, click.linkFromUrl, click.linkToUrl, click.score, click.yourVote);
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

        delete rbutr.canonical_urls[tabId];
        delete rbutr.plain_urls[tabId];
    });



    /**
     * @description Fires when a tab is updated
     */
    browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

        'use strict';

        // ensure that the url data lives for the life of the page, not the tab
        if (changeInfo.status === 'loading') {
            if (tab.url == rbutr.plain_urls[tabId]) {
                return;
            }
            delete rbutr.canonical_urls[tabId];
            delete rbutr.plain_urls[tabId];
        }
    });


});
