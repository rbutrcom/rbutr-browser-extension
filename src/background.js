
/*global chrome,console,$*/
/*jslint browser: true */

    // Global
    // For submission
    var submittingRebuttal = false;
    var fromUrls = [];
    var toUrls = [];
    var comment = [];
    var tags = [];
    var loggedIn;
    var submitError;
    var direct = false;
    var cid = getCid();
    // Other globals
    var recordedClicks = {};
    // var voteUpDiv;
    // var voteDownDiv;

    // Per tab
    // Keyed by tabId
    var rebuttals = {};
    // Keyed by tabId
    var rebuttalCount = {};

    // From HERE to below is based on code from https://github.com/kevmoo/chromeCanonicalExtension.
    var canonical_urls = {};
    var plain_urls = {};
    var url_is_canonical = {};
    var page_title = {};
    console.log("background initialised " + new Date());


/*
//NOT USED
    var linkContextId = chrome.contextMenus.create({
        title: "Submit as rebutted by current page",
        contexts: ["link"],
        onclick: contextLinkSelected
    });

    var textContextId = chrome.contextMenus.create({
        title: "Use text as rebuttal comment.",
        contexts: ["selection"],
        onclick: contextTextSelected
    });
*/


    chrome.extension.onRequest.addListener(function (request, sender, callback) {

        'use strict';

        if (request.action) {
            if (request.action == 'log') {
                console.log(request.text);

            }  else if (request.action == 'error') {
                console.error(request.text);

            } else if (request.action == 'setCanonical') {
                var tab = request.tab || sender.tab;
                var canonicalUrl = getCanonicalUrl(tab.url);
                var url = canonicalUrl || tab.url;

                if (!/^http/.test(canonicalUrl)) {
                    return;
                }

                url_is_canonical[url] = !!canonicalUrl;
                canonical_urls[tab.id] = canonicalUrl;
                plain_urls[tab.id] = tab.url;

                page_title[url] = tab.title;
                // console.log("tab[" + tab.id + "] set canonical_url " + tab.url + " to " + canonicalUrl);
                tabLoaded(tab.id, url);

            } else if (request.action == 'setClick') {
                var click = request.click;
                recordLinkClick(null, click.linkId, click.linkFromUrl, click.linkToUrl, click.score, click.yourVote);
                console.log("click recorded : " + click.linkToUrl);
            }
        }
    });



    // tab is going away, remove the canonical data for it
    chrome.tabs.onRemoved.addListener(function (tabId) {

        'use strict';

        delete canonical_urls[tabId];
        delete plain_urls[tabId];
    });



    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

        'use strict';

        // ensure that the url data lives for the life of the page, not the tab
        if (changeInfo.status == "loading") {
            if (tab.url == plain_urls[tabId] ) {
                // console.log("Skipping clearing canonical_url IT HASN'T CHANGED : "  + canonical_urls[tabId]);
                return;
            }
            // console.log("tab[" + tabId + "] loading - clearing canonical_url : was "  + canonical_urls[tabId]);
            // console.log("tab[" + tabId + "] = " , tab);
            delete canonical_urls[tabId];
            delete plain_urls[tabId];
        }
    });
    // END pull from https://github.com/kevmoo/chromeCanonicalExtension

    // END OF STARTUP CODE (should only be functions from here down).


/*
//NOT USED
    function contextLinkSelected(info, tab) {
        if (!alreadyExists(info.linkUrl)) {
            fromUrls[fromUrls.length] = info.linkUrl;
        }
        if (!alreadyExists(canonical_urls[tab.id]) ) {
            toUrls[toUrls.length] = canonical_urls[tab.id];
        }
        if (!submittingRebuttal ) {
            comment = [];
            tags = [];
            submitError = "";
            submittingRebuttal = true;
        }
    }
*/



    function alreadyExists(url) {

        'use strict';

        for (var i  = 0 ; i < fromUrls.length ; i++ ) {
            if (fromUrls[i] == url ) {
                return true;
            }
        }
        for (var j  = 0 ; j < toUrls.length ; j++ ) {
            if (toUrls[j] == url ) {
                return true;
            }
        }
        return false;
    }



    function getPageTitle(url) {

        'use strict';

        if (page_title[url] ) {
            return page_title[url];
        } else {
            return "No title";
        }
    }



    function getPopup() {

        'use strict';

        var popups = chrome.extension.getViews({type: "popup"});
        if (popups.length > 0) {
            return popups[0];
        } else {
            return null;
        }
    }



    function displayMessage(message) {

        'use strict';

        var popup = getPopup();

        if (popup == null ) {
            console.error("Popup was null, couldn't display : " + message);
        } else {
            popup.displayMessage(message);
        }
    }

    function submitRebuttals(tabId) {

        'use strict';

        var fromPageTitles = [];
        var toPageTitles = [];
        var canonicalFromPages = [];
        var canonicalToPages = [];

        for (var i  = 0; i < toUrls.length; i++) {
            toPageTitles[i] = page_title[toUrls[i]];
            canonicalToPages[i] = url_is_canonical[toUrls[i]];
        }

        for (var j  = 0; j < fromUrls.length; j++) {
            fromPageTitles[j] = page_title[fromUrls[j]];
            canonicalFromPages[j] = url_is_canonical[fromUrls[j]];
        }

        $.post("http://rbutr.com/rbutr/PluginServlet", {
            submitLinks: true,
            fromUrls: fromUrls,
            toUrls: toUrls,
            fromPageTitles: fromPageTitles,
            toPageTitles: toPageTitles,
            comments: comment,
            canonicalFromPages: canonicalFromPages,
            canonicalToPages: canonicalToPages,
            direct: direct,
            tags: tags,
            cid: cid
        }, function (data) {
            console.log("sucess status " + data.status);
            displayMessage('<b>' + data.result + '</b>');
            window.open(data.redirectUrl);
            getPopup().cancelSubmission(); // Clear the data now that it's submitted.
            tabLoaded(tabId, canonical_urls[tabId]); // This will reload the for the tab, and set the badge.
        },'json').done(function (msg) {
            console.log("done status " + msg.status);
        }).fail(function (msg,arg2,arg3) {
            displayMessage("Failed to submit : " + msg.responseText);
            console.log("fail status " + msg.status);
            console.log("msg = " , msg);
            console.log("arg2 = " , arg2);
            console.log("arg3 = " , arg3);
        });
        // console.log("immediate status " + jqxhr.status);
        // console.log("jqxhr = " , jqxhr);
    }



/*
//NOT USED
    function contextTextSelected(info, tab) {
        // console.log("item " + info.menuItemId + " was clicked");
        // console.log("info: " + JSON.stringify(info));
        // console.log("tab: " + JSON.stringify(tab));
        if (!submittingRebuttal) {
            comment = [];
            tags = [];
            submitError = "";
            submittingRebuttal = true;
        }
        comment[0] = info.selectionText;
    }
*/



    function startSubmission(tabId, fromTo) {

        'use strict';

        submittingRebuttal = true;
        if (fromTo == "from") {
            fromUrls[0] = canonical_urls[tabId];
            // toUrl = "Please navigate to the rebuttal page and select using above link";
        } else {
            toUrls[0] = canonical_urls[tabId];
            // fromUrl = "Please navigate to the source page and select using above link";
        }
        comment = [];
        submitError = "";
        tags = [];
    }



    function stopSubmission() {

        'use strict';

        submittingRebuttal = false;
        fromUrls = [];
        toUrls = [];
        comment = [];
        tags = [];
    }

    // This is now called above after canonical is set.
    // chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //     if (changeInfo.status == "loading") {
    //         tabLoaded(tab,tabId);
    //         chrome.tabs.sendRequest(tab.id, {greeting: tab.url}, function (response) {
    //             console.log(response.farewell);
    //         });
    //        chrome.tabs.executeScript(tabId, { code: "alert('Hello World " + tablink + "')" });
    //     }
    // });

    function addTag(tagText) {

        'use strict';

        if (tags.length >= 6 ) {
            return;
        }
        removeTag(tagText); // Avoid duplicates.
        tags[tags.length] = tagText;
    }



    function removeTag(tagText) {

        'use strict';

        var index = tags.indexOf(tagText);
        if (index >= 0 ) {
            tags.splice(index, 1);
        }
    }



    // For communicating with the content script for it to pop stuff up.
    function postMessage(tabId, titleMessage) {

        'use strict';

        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tabId, { message: titleMessage, url: canonical_urls[tabId] }, function (response) {
                console.log(response);
            });
        });
    }



    function tabLoaded(tabId, url) {

        'use strict';

        rebuttals[tabId] = null;
        var vote = false;
        var recordedClick = getRecordedClickByToUrl(canonical_urls[tabId]);
        // Don't show voting after you've voted
        if (recordedClick != null && recordedClick.yourVote === 0) {
            vote = true;
        }

        var urlHash = b64_md5(url);
        $.get('http://rbutr.com/rbutr/PluginServlet', {
            getLinks: true,
            fromPageUrlHash: urlHash,
            version: chrome.app.getDetails().version,
            cid: cid
        }, function (data) {
            rebuttals[tabId] = data;
            loggedIn = true;
            var m = rebuttals[tabId].match(/id="notLoggedIn"/g);
            if (m != null && m.length > 0) {
                loggedIn = false;
            }
            var titleMessage;
            if (rebuttals[tabId].indexOf('<h2 class="status">No Rebuttals</h2><br style="clear:left;">') != -1 ) {
                rebuttalCount[tabId] = 0;
                // No rebuttals
                chrome.browserAction.setBadgeText({ text: "", tabId: tabId});
                if (vote && loggedIn) {
                    chrome.browserAction.setBadgeText({ text: "Vote", tabId: tabId});
                    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 255, 0, 255], tabId: tabId});
                    titleMessage = "You can vote on this.";
                    chrome.browserAction.setTitle({tabId: tabId, title: titleMessage});
                    postMessage(tabId, titleMessage);
                } else {
                    chrome.browserAction.setTitle({tabId: tabId, title: "RbutR - There are no rebuttals to this page, do you know of one?"});
                }
                // } else if (rebuttals[tabId].indexOf("You are not logged in") != -1 ) {
                //     loggedIn = false;
                //     chrome.browserAction.setBadgeText({ text: "NOTE", tabId: tabId});
                //     chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255], tabId: tabId});
                //     chrome.browserAction.setTitle({tabId: tabId, title: "You are not logged in! rbutr requires you to be logged in."});
            } else {
                var matches = rebuttals[tabId].match(/class="thumbsUp"/g);
                var count = Number( matches == null ? 0 : matches.length ).toString();
                rebuttalCount[tabId] = count;
                var rebuttal_plural = "rebuttals";

                if (count == 1) {
                    rebuttal_plural = "rebuttal";
                }

                if (vote && loggedIn) {
                    chrome.browserAction.setBadgeText({ text: "V " + count, tabId: tabId});
                    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 100, 100, 255], tabId: tabId});
                    titleMessage = "You can vote on this, and there is also " + count + " " + rebuttal_plural + ".";
                    chrome.browserAction.setTitle({tabId: tabId, title: titleMessage});
                } else {
                    chrome.browserAction.setBadgeText({ text: count, tabId: tabId});
                    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255], tabId: tabId});
                    titleMessage = "This page has " + count + " " + rebuttal_plural + ".";
                    chrome.browserAction.setTitle({tabId: tabId, title: titleMessage});
                }

                postMessage(tabId, titleMessage);
            }
        }).error( function (msg) {
            rebuttals[tabId] = msg.responseText;
        });
    }



    function recordLinkClick(fromTabId, linkId, linkFromUrl, linkToUrl, score, yourVote) {

        'use strict';

        recordedClicks[linkToUrl] = {
            fromTabId: fromTabId,
            linkId: linkId,
            linkFromUrl: linkFromUrl,
            linkToUrl: linkToUrl,
            score: score,
            yourVote: yourVote
        };
    }



    function getRecordedClickByToUrl(toUrl) {

        'use strict';

        // for (var key in recordedClicks) {
        //     console.log('key is: ' + key + ', value is: ' + eval('myArray.' + key));
        // }
        return recordedClicks[toUrl];
    }



    function getCid() {

        'use strict';

        var CID_KEY = "rbutr_cid";
        var cid = localStorage.getItem(CID_KEY);
        if (!cid) {
            var ms = new Date().getTime();
            var rnd = Math.floor( (Math.random() * 1000) + 1);
            cid = ms + ("0000" + rnd).slice(-4);
            localStorage.setItem(CID_KEY, cid);
        }
        return cid;
    }


    // This is based on code from https://github.com/kevmoo/chromeCanonicalExtension
    var simpleAbsoluteUrlMatch = '^[a-zA-Z]+://.*';



    // generate an absolute url (protocol, host, path) from a canonicalValue that might be relative
    function getCanonicalUrl(canonicalValue) {

        'use strict';

        if (canonicalValue) {
            if (canonicalValue.match(simpleAbsoluteUrlMatch)) {
                // canonicalValue is a full url
                return canonicalValue;
            } else if (canonicalValue.match('^/.*')) {
                // canonicalValue is an absolute url in the current host
                return location.protocol + '//' + location.host + canonicalValue;
            } else {
                error('The canonical URL is relative and does not start with "/". Not supported.');
                return null;
            }
        } else {
            return null;
        }
    }
