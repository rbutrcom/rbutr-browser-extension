/*global browser,console,$,b64_md5*/
/*jslint browser:true,esnext:true */


window.browser = (function () {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();



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

    this.serverUrl = '';
    this.cid = '';

    this.simpleAbsoluteUrlMatch = '^[a-zA-Z]+://.*';
}



Rbutr.prototype = {

    constructor: Rbutr,


    isDev: function () {

        'use strict';

        var dev = localStorage.getItem('rbutr-is-dev');
        return dev === 'true';
    },



    logDev: function () {

        'use strict';

        if(this.isDev()) {
            // only continue if there are more than 1 params (0 = level, 1-x = output)
            if(arguments.length > 1) {
                var logLevel = console[arguments[0]],
                    logArguments = [];

                for (var i = 1; i < arguments.length; i++) {
                    logArguments.push(arguments[i]);
                }

                if(typeof logLevel === 'function') {
                    logLevel.apply(null, ['[rbutr] '].concat(logArguments));
                } else {
                    console.error('[rbutr] console.' + arguments[0] + ' is not a valid logging function.');
                    console.debug.apply(null, ['[rbutr] '].concat(logArguments));
                }
            }
        }
    },



    getCid: function () {

        'use strict';

        var CID_KEY = 'rbutr_cid';
        var cid = localStorage.getItem(CID_KEY);
        if (!cid) {
            var ms = new Date().getTime();
            var rnd = Math.floor((Math.random() * 1000) + 1);
            cid = ms + ('0000' + rnd).slice(-4);
            localStorage.setItem(CID_KEY, cid);
        }
        return cid;
    },



    initialize: function () {

        'use strict';

        this.serverUrl = this.isDev() ? 'https://russell.rbutr.com' : 'http://rbutr.com';
        this.cid = this.cid;

        this.logDev('info','rbutr initialised ', new Date());
    },



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



    getPageTitle: function (url) {

        'use strict';

        if (this.page_title[url]) {
            return this.page_title[url];
        } else {
            return 'No title';
        }
    },



    getPopup: function () {

        'use strict';

        var popups = browser.extension.getViews({type: 'popup'});
        if (popups.length > 0) {
            return popups[0];
        } else {
            return null;
        }
    },


    displayMessage: function (message) {

        'use strict';

        var popup = this.getPopup();

        if (popup === null) {
            this.logDev('error', 'Popup was null, couldn\'t display : ', message);
        } else {
            popup.displayMessage(message);
        }
    },



    // For communicating with the content script for it to pop stuff up.
    postMessage: function (tabId, titleMessage) {

        'use strict';

        // Get the current active tab in the lastly focused window
        browser.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, function () {
            browser.tabs.sendMessage(tabId, {message: titleMessage, url: rbutr.canonical_urls[tabId]}, function (response) {
                rbutr.logDev('debug', response);
            });
        });
    },



    getRecordedClickByToUrl: function (toUrl) {

        'use strict';

        return this.recordedClicks[toUrl] ? this.recordedClicks[toUrl] : null;
    },



    tabLoaded: function (tabId, url) {

        'use strict';

        this.rebuttals[tabId] = null;
        var vote = false;
        var recordedClick = this.getRecordedClickByToUrl(this.canonical_urls[tabId]);
        // Don't show voting after you've voted
        if (recordedClick !== null && recordedClick.yourVote === 0) {
            vote = true;
        }


        $.get(this.serverUrl + '/rbutr/PluginServlet', {
            getLinks: true,
            fromPageUrlHash: b64_md5(url),
            version: browser.runtime.getManifest().version,
            cid: rbutr.cid
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
                    rbutr.postMessage(tabId, titleMessage);
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

                rbutr.postMessage(tabId, titleMessage);
            }
        }).error(function (msg) {
            rbutr.rebuttals[tabId] = msg.responseText;
        });
    },



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

        $.post(this.serverUrl + '/rbutr/PluginServlet', {
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
            cid: rbutr.cid
        }, function (data) {
            rbutr.logDev('debug', 'success status ', data.status);
            rbutr.displayMessage('<b>' + data.result + '</b>');
            window.open(data.redirectUrl);
            rbutr.getPopup().cancelSubmission(); // Clear the data now that it's submitted.
            rbutr.tabLoaded(tabId, rbutr.canonical_urls[tabId]); // This will reload the for the tab, and set the badge.
        }, 'json').done(function (msg) {
            rbutr.logDev('debug', 'done status ', msg.status);
        }).fail(function (msg, arg2, arg3) {
            rbutr.displayMessage('Failed to submit : ' + msg.responseText);
            rbutr.logDev('debug', 'fail status ', msg.status);
            rbutr.logDev('debug', 'msg = ', msg);
            rbutr.logDev('debug', 'arg2 = ', arg2);
            rbutr.logDev('debug', 'arg3 = ', arg3);
        });
    },



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



    stopSubmission: function () {

        'use strict';

        this.submittingRebuttal = false;
        this.fromUrls = [];
        this.toUrls = [];
        this.comment = [];
        this.tags = [];
    },



    removeTag: function (tagText) {

        'use strict';

        var index = this.tags.indexOf(tagText);
        if (index >= 0) {
            this.tags.splice(index, 1);
        }
    },



    addTag: function (tagText) {

        'use strict';

        if (this.tags.length >= 6) {
            return;
        }
        this.removeTag(tagText); // Avoid duplicates.
        this.tags[this.tags.length] = tagText;
    },



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



    // generate an absolute url (protocol, host, path) from a canonicalValue that might be relative
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
                this.logDev('error', 'The canonical URL is relative and does not start with "/". Not supported.');
                return null;
            }
        } else {
            return null;
        }
    }
};

var rbutr = new Rbutr();
rbutr.initialize();

browser.runtime.onMessage.addListener(function (request, sender) {

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
            rbutr.logDev('debug', 'click recorded: ', click.linkToUrl);
        }
    }
});



// tab is going away, remove the canonical data for it
browser.tabs.onRemoved.addListener(function (tabId) {

    'use strict';

    delete rbutr.canonical_urls[tabId];
    delete rbutr.plain_urls[tabId];
});



browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    'use strict';

    // ensure that the url data lives for the life of the page, not the tab
    if (changeInfo.status == 'loading') {
        if (tab.url == rbutr.plain_urls[tabId]) {
            return;
        }
        delete rbutr.canonical_urls[tabId];
        delete rbutr.plain_urls[tabId];
    }
});
