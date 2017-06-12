/*!
 * Rbutr Browser Extension v0.9.7
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global browser,console,$,JSON,RbutrUtils,b64_md5*/
/*jslint browser:true,esnext:true */


/**
 * @description Multi-Browser support:If we don't have a chrome object, check for browser and rename.
 */
if (typeof window.chrome !== 'undefined' && typeof window.browser === 'undefined') {
    window.browser = window.chrome;
}



const ZERO = 0;
const ONE = 1;
const FIRST_ARRAY_ELEMENT = 0;

const rbutrUtils = RbutrUtils();


/**
 * @description Set up supported platforms
 */
const platforms = {
    none: {
        itemSelectors: [],
        observer: {
            root: '',
            filter: []
        },
        externalLinkPattern: null,
        cleanurl: function (url) {
            'use strict';
            return url;
        }
    },

    facebook: {
        itemSelectors: [{
            parent: '._1dwg',
            body: '.mtm'
        }, {
            parent: '.UFICommentContent',
            body: '.UFICommentBody'
        }],
        observer: {
            //root: 'body',
            root: '#pagelet_timeline_main_column',
            filter: [{ element: 'div' }]
        },
        externalLinkPattern: new RegExp(/^https?:\/\/l\.facebook\.com\/l\.php\?u=([^&]+)/),
        cleanurl: function (dirtyUrl) {

            'use strict';

            const TEST_LINK_LENGTH = 30;
            let
                cleanedUrl = '',
                testLink = decodeURIComponent(dirtyUrl).substring(ZERO, TEST_LINK_LENGTH);


            if (testLink === 'https://l.facebook.com/l.php?u=' || testLink === 'http://l.facebook.com/l.php?u=') {
                cleanedUrl = decodeURIComponent(dirtyUrl).substring(TEST_LINK_LENGTH).split('&h=', ONE);
            } else {
                cleanedUrl = dirtyUrl;
            }

            return cleanedUrl;
        }
    }
};



/**
 * @method Platform
 * @description Platform class constructor with variable initialisation
 *
 * @return {Object} Public object methods
 */
const Platform = () => {

    'use strict';

    let properties = {
        name : 'none',
        config : platforms.none,
        url : ''
    };



    /**
     * @method getProp
     * @description Property getter
     *
     * @param {String} name - Object name in variable "properties"
     * @return {(String|Object)} Property value
     */
    const getProp = (name) => {
        return properties[name];
    };



    /**
     * @method setProp
     * @description Property setter
     *
     * @param {String} name - Object name in variable "properties"
     * @param {*} value - The value to be set in "properties.<name>"
     * @return {void}
     */
    const setProp = (name, value) => {
        properties[name] = value;
    };



    /**
     * @method cleanUrl
     * @description Strip urls down to hostname
     *
     * @param {String} dirtyUrl - The URL to be cleaned
     * @return {String} - Returns domain contained in the given URL
     */
    const cleanUrl = (dirtyUrl) => {

        let
            cleanedUrl = '',
            fn = platforms[getProp('name')].cleanurl;

        if (typeof fn === 'function') {
            cleanedUrl = fn(dirtyUrl);
        } else {
            cleanedUrl = dirtyUrl;
        }

        return rbutrUtils.url2Domain(cleanedUrl);
    };



    /**
     * @method expandExternalLinks
     * @description Extract and expand external links from platform urls
     *
     * @param {Object} $element - An <a href> DOM object
     * @return {(String|Boolean)} Returns the expanded URL or false
     */
    const expandExternalLinks = ($element) => {

        const SECOND_ARR_ELEMENT = 1;
        let
            matches = null,
            matchedUrl = null;

        if (getProp('config').externalLinkPattern !== null) {
            matches = getProp('config').externalLinkPattern.exec($element.attr('href'));
            if (matches.length >= SECOND_ARR_ELEMENT) {
                matchedUrl = decodeURIComponent(matches[SECOND_ARR_ELEMENT]);

                if (matchedUrl !== null) {
                    return matchedUrl;
                }
            }
        }

        return false;
    };



    /**
     * @method refresh
     * @description Refresh the platform
     *
     * @return {void}
     */
    const refresh = () => {


        setProp('url', rbutrUtils.url2Domain(window.location.hostname));

        switch (getProp('url')) {
        case 'www.facebook.com':
        case 'facebook.com':
            setProp('name', 'facebook');
            break;
        default:
            setProp('name', 'none');
            break;
        }

        setProp('config', platforms[getProp('name')]);
    };

    return {getProp, setProp, cleanUrl, expandExternalLinks, refresh};
};



/**
 * @method Content
 * @description Content class constructor with variable initialisation
 *
 * @return {Object} Public object methods
 */
const Content = () => {

    'use strict';

    let canonicalValue = $('head link[rel=canonical]').attr('href');
    let title = $('title').text();
    let mutationObserver = {};

    let cid = 0;
    let serverUrl = '';
    let serverDomain = '';
    let version = 0;

    let platform = Platform();
    platform.refresh();



    /**
     * @method shouldShowMessage
     * @description Determine, wether rbutr message box should appear or not
     *
     * @param {String} url - URL to be checked
     * @return {Boolean} Resulting state
     */
    const shouldShowMessage = (url) => {

        let result = localStorage.getItem('rbutr.dontshow.' + url);
        return result === undefined || result === null;
    };



    /**
     * @method createMessageTemplate
     * @description Create html template and fill it with data from given object
     *
     * @param {Object} $entry - Data object to be rendered
     * @param {String} type - Type of data
     * @return {String} Returns a HTML template string
     */
    const createSingleMessageEntry = ($entry, type) => {
        return `
            <div class="rbutr-message-entry">
                <h6>${$entry[type].title}</h6>
                <a href="${$entry[type].url}">${$entry[type].url}</a>

                <div class="rbutr-info">
                    <table>
                        <tr>
                            <th>Upvotes:</th>
                            <th>Downvotes:</th>
                            <th>Clicks:</th>
                            <th>Views:</th>
                        </tr>
                        <tr>
                            <td>${$entry.upVotes}</td>
                            <td>${$entry.downVotes}</td>
                            <td>${$entry.clickCount}</td>
                            <td>${$entry.viewCount}</td>
                        </tr>
                        <tr>
                            <td class="rbutr-footer" colspan="4"><small>
                                Created on ${$entry.creationDate}
                                by <a href="${content.serverDomain}/rbutr/LoginServlet?requestType=userPage&personId=${$entry.person.id}">${$entry.person.username}</a>
                            </small></td>
                    </table>
                </div>
            </div>
        `;
    };



    /**
     * @method createMessageTemplate
     * @description Create html template and fill it with data from given object
     *
     * @param {Object} $data - The fetched data as object
     * @param {String} requestedUrl - URL the data is for; For etermining if it's rebutted or a rebuttal
     * @return {String} Returns a HTML template string
     */
    const createMessageTemplate = ($data, requestedUrl) => {

        let
            messageTemplate = '',
            rbutrLogo = '<img src="' + content.serverDomain + '/images/logohomepagelowres.png" width="24" class="rbutr-logo" alt="Rbutr">',
            detailsButton = '<div><button class="more" onclick="this.parentNode.nextElementSibling.classList.toggle(\'hidden\');">Details</button><div class="clearfix"></div></div>',
            rebuttedCount = ZERO,
            rebuttalCount = ZERO,
            rebuttedList = '',
            rebuttalList = '';


        if ($data.direct.length > ZERO || $data.general.length > ZERO) {
            messageTemplate += `
                <div class="rbutr-message">
                    ${rbutrLogo}
                `;

            if ($data.direct.length > ZERO) {
                for (let index in $data.direct) {

                    if (rbutrUtils.unicode2String($data.direct[index].fromPage.url) === requestedUrl) {
                        rebuttedCount++;
                        rebuttedList += createSingleMessageEntry($data.direct[index], 'toPage');
                    } else if (rbutrUtils.unicode2String($data.direct[index].toPage.url) === requestedUrl) {
                        rebuttalCount++;
                        rebuttalList += createSingleMessageEntry($data.direct[index], 'fromPage');
                    }
                }
            }
            if ($data.general.length > ZERO) {
                for (let index in $data.general) {

                    if (rbutrUtils.unicode2String($data.general[index].fromPage.url) === requestedUrl) {
                        rebuttedCount++;
                        rebuttedList += createSingleMessageEntry($data.general[index], 'toPage');
                    } else if (rbutrUtils.unicode2String($data.general[index].toPage.url) === requestedUrl) {
                        rebuttalCount++;
                        rebuttalList += createSingleMessageEntry($data.general[index], 'fromPage');
                    }
                }
            }


            if (rebuttalCount > ZERO && rebuttedCount > ZERO) {
                messageTemplate += `
                    <h4>This page has been rebutted by ${rebuttedCount} ${rebuttedCount > ONE ? 'pages' : 'page'}
                    and rebuts ${rebuttalCount} other ${rebuttalCount > ONE ? 'pages' : 'page'}</h4>
                    ${detailsButton}
                    <div class="details hidden">
                        <h5>Rebutted by</h5>
                        ${rebuttedList}
                        <h5>Rebuttal for</h5>
                        ${rebuttalList}
                    </div>
                `;
            } else if (rebuttalCount > ZERO) {
                messageTemplate += `
                    <h4>This page rebuts ${rebuttalCount} other ${rebuttalCount > ONE ? 'pages' : 'page'}</h4>
                    ${detailsButton}
                    <div class="details hidden">
                        <h5>Rebuttal for</h5>
                        ${rebuttalList}
                    </div>
                `;
            } else if (rebuttedCount > ZERO) {
                messageTemplate += `
                    <h4>This page has been rebutted by ${rebuttedCount} ${rebuttedCount > ONE ? 'pages' : 'page'}</h4>
                    ${detailsButton}
                    <div class="details hidden">
                        <h5>Rebutted by</h5>
                        ${rebuttedList}
                    </div>
                `;
            }

            messageTemplate += '</div>';
        } else {
            // Do nothing yet
        }

        return messageTemplate;
    };



    /**
     * @method getRbutrData
     * @description Get data from server by url
     *
     * @param {String} url - URL which data is needed
     * @param {Object} $element - Target DOM element to operate in
     * @param {Function} callback - Function to handle data after retrieving
     * @return {void}
     */
    const getRbutrData = (url, $element, callback) => {

        $.get(content.serverUrl, {
            getLinks: true,
            fromPageUrlHash: b64_md5(url),
            version: content.version,
            cid: content.cid,
            json: true
        }, 'json').done( function (data) {
            callback(data, url, $element);
        });
    };



    /**
     * @method setAlertOnPosts
     * @description Target and modify platform post based on platform config
     *
     * @return {Boolean} Returns true after it's done
     */
    const setAlertOnPosts = () => {

        let
            index = 0,
            itemSelectors = platform.getProp('config').itemSelectors,
            $linkWrapper = {},
            ownHostRegExp = new RegExp(window.location.host),
            expandedUrl;

        for (index in itemSelectors) {

            let
                parentSelector = itemSelectors[index].parent,
                bodySelector = itemSelectors[index].body;

            $(parentSelector + ' ' + bodySelector + ':not([data-rbutr-processed]) a').each(function () {
                // exclude links that have the same hostname
                if (ownHostRegExp.test(this.href) === false) {
                    $linkWrapper = $(this).closest(bodySelector);
                    if ($linkWrapper.attr('data-rbutr-processed') !== 'true') {
                        let
                            $currentLink = $(this),
                            messageTemplate = '';

                        expandedUrl = platform.expandExternalLinks($currentLink);

                        if(expandedUrl) {
                            content.getRbutrData(expandedUrl, $linkWrapper, function (result, url, $element) {
                                messageTemplate = content.createMessageTemplate(result, url);
                                $element.after($('<div class="rbutr-message-container"></div>').html(messageTemplate));
                            });
                            $linkWrapper.attr('data-rbutr-processed', true);
                        }
                    }
                }
            });
        }

        return true;
    };



    /**
     * @method observe
     * @description Turn on the mutation observer
     *
     * @return {void}
     */
    const observe = () => {

        let
            observerRoot = platform.getProp('config').observer.root,
            observerRootObj = document.querySelector(observerRoot),
            //observerFilter = content.platform.config.observer.filter,

            observerConfig = {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            };


        mutationObserver = new MutationObserver(function(mutations, thisInstance) {
            let result = content.setAlertOnPosts();
            if(result === true) {
                thisInstance.disconnect();
                content.execute();
            }
        });

        mutationObserver.observe(observerRootObj, observerConfig);
    };



    /**
     * @method execute
     * @description Execute the script
     *
     * @return {void}
     */
    const execute = () => {

        const TIMEOUT_OBSERVE = 1000;
        const TIMEOUT_ALERTING = 2000;

        if (platform.getProp('name') !== 'none') {
            window.setTimeout(content.observe, TIMEOUT_OBSERVE);
            window.setTimeout(content.setAlertOnPosts, TIMEOUT_ALERTING);
        }
    };

    return {canonicalValue, title, mutationObserver, cid, serverUrl, serverDomain, version, shouldShowMessage, createSingleMessageEntry, createMessageTemplate, getRbutrData, setAlertOnPosts, observe, execute};
};



const content = Content();

document.onreadystatechange = function () {

    'use strict';

    if (document.readyState === 'complete') {

        browser.runtime.sendMessage({'action': 'getCid'}, function (response) {
            content.cid = response;
        });
        browser.runtime.sendMessage({'action': 'getServerUrl'}, function (response) {
            content.serverUrl = response;
        });
        browser.runtime.sendMessage({'action': 'getServerDomain'}, function (response) {
            content.serverDomain = response;
        });
        browser.runtime.sendMessage({'action': 'getVersion'}, function (response) {
            content.version = response;
        });
        browser.runtime.sendMessage({'action': 'setCanonical', 'url': content.canonicalValue || location.href, 'title': content.title});



        /**
         * @description Handle requests from background script
         */
        browser.runtime.onMessage.addListener(function (request) {

            const TIMEOUT_HIDE_FLOATER = 5000;

            if (request.action === 'showMessageBox') {
                if (content.shouldShowMessage(request.url)) {
                    $('body').append(
                        `<div id="rbutrfloatdiv">
                            <center>
                                <img src="http://rbutr.com/images/logo_small_transparent.png">
                                <br>
                                ${request.message}
                                <br><br>
                                <span>This message will fade in 5 secs.</span>
                                <div>
                                    <label>
                                        <input id="dontShowAgain" type="checkbox">
                                        &nbsp;Don't tell me again for this page
                                    </label>
                                </div>
                            </center>
                        </div>`
                    );

                    window.setTimeout(function () {
                        $('#rbutrfloatdiv').remove();
                    }, TIMEOUT_HIDE_FLOATER);

                    $('#dontShowAgain').click(function () {
                        localStorage.setItem('rbutr.dontshow.' + request.url, $('#dontShowAgain')[FIRST_ARRAY_ELEMENT].checked);
                    });
                }
            }

            return true;
        });



        // When the user clicks through from our webpage, rather than the plugin, we hide the click details in the re-direct page.
        if ($('#clickDataForRbutrPlugin').length) { // jQuery never returns null.. http://stackoverflow.com/questions/477667/how-to-check-null-objects-in-jquery
            let click = JSON.parse($('#clickDataForRbutrPlugin').text());
            browser.runtime.sendMessage({'action': 'setClick', 'click': click});
        }


        $('body').append('<div id="rbutr-installed"></div>');
        $('.rbutr-message .more').click(function () {
            $('.rbutr-message .details').toggleClass('hidden');
        });
        content.execute();
    }
};
