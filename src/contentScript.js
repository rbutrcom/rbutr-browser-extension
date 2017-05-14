/*global browser,console,$,JSON,RbutrUtils,b64_md5*/
/*jslint browser:true,esnext:true */


/**
 * @description Multi-Browser support:If we don't have a chrome object, check for browser and rename.
 */
if (typeof chrome !== 'undefined' && typeof browser === 'undefined') {
    browser = chrome;
}



const rbutrUtils = new RbutrUtils();


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
        cleanurl: function (url) {

            'use strict';

            var
                testLink = '',
                thisUrl = '';

            testLink = decodeURIComponent(url).substring(0, 30);

            if (testLink === 'https://l.facebook.com/l.php?u=' || testLink === 'http://l.facebook.com/l.php?u=') {
                thisUrl = decodeURIComponent(url).substring(30).split('&h=', 1);
                url = thisUrl;
            }

            return url;
        }
    }
};



/**
 * @description Platform class constructor with variable initialisation
 *
 * @method Platform
 * @param {void}
 * @return {object}
 */
function Platform() {

    'use strict';

    this.name = 'none';
    this.config = platforms.none;
    this.url = '';

    return this;
}



Platform.prototype = {

    constructor: Platform,


    /**
     * @description Strip urls down to hostname
     *
     * @method cleanUrl
     * @param {string} url
     * @return {string}
     */
    cleanUrl: function (url) {

        'use strict';

        var
            cleanedUrl = '',
            fn = platforms[this.name].cleanurl;

        if (typeof fn === 'function') {
            cleanedUrl = fn(url);
        } else {
            cleanedUrl = url;
        }

        return rbutrUtils.url2Domain(cleanedUrl);
    },



    /**
     * @description Extract and expand external links from platform urls
     *
     * @method expandExternalLinks
     * @param {object} element
     * @return {string}
     */
    expandExternalLinks: function ($element) {

        'use strict';

        var
            matches = null,
            matchedUrl = null;

        if (this.config.externalLinkPattern !== null) {
            if (matches = this.config.externalLinkPattern.exec($element.attr('href'))) {
                matchedUrl = decodeURIComponent(matches[1]);

                if (matchedUrl !== null) {
                    return matchedUrl;
                }
            }
        }

        return false;
    },



    /**
     * @description Refresh the platform
     *
     * @method refresh
     * @param {void}
     * @return {void}
     */
    refresh: function () {

        'use strict';


        this.url = rbutrUtils.url2Domain(window.location.hostname);

        switch (this.url) {
        case 'www.facebook.com':
        case 'facebook.com':
            this.name = 'facebook';
            break;
        default:
            this.name = 'none';
            break;
        }

        this.config = platforms[this.name];
    }

};



/**
 * @description Content class constructor with variable initialisation
 *
 * @method Content
 * @param {void}
 * @return {object}
 */
function Content() {

    'use strict';

    this.canonicalValue = $('head link[rel=canonical]').attr('href');
    this.title = $('title').text();
    this.mutationObserver = {};

    this.cid = 0;
    this.serverUrl = '';
    this.serverDomain = '';
    this.version = 0;

    this.platform = new Platform();
    this.platform.refresh();

    return this;
}



Content.prototype = {

    constructor: Content,


    /**
     * @description Determine, wether rbutr message box should appear or not
     *
     * @method shouldShowMessage
     * @param {string} url
     * @return {boolean}
     */
    shouldShowMessage: function (url) {

        'use strict';

        var result = !localStorage.getItem('rbutr.dontshow.' + url);
        return result === undefined || result === null;
    },



    /**
     * @description Create html template and fill it with data from given object
     *
     * @method createMessageTemplate
     * @param {object} data
     * @return {string}
     */
    createMessageTemplate: function (data) {

        let
            messageTemplate = '',
            rbutrLogo = '<img src="' + this.serverDomain + '/images/logohomepagelowres.png" width="24" class="rbutr-logo" alt="Rbutr">';

        if (data.direct.length > 0 || data.general.length > 0) {
            if (data.direct.length > 0) {
                for (let index in data.direct) {

                    messageTemplate += `
                        <div class="rbutr-message">
                            ${rbutrLogo}
                            <table>
                                <tr>
                                    <th>Rebutted:</th>
                                    <td>
                                        <h6>${data.direct[index].fromPage.title}</h6>
                                        <a href="${data.direct[index].fromPage.url}">${data.direct[index].fromPage.url}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Rebuttal:</th>
                                    <td>
                                        <h6>${data.direct[index].toPage.title}</h6>
                                        <a href="${data.direct[index].toPage.url}">${data.direct[index].toPage.url}</a>
                                    </td>
                                </tr>
                            </table>

                            <table class="rbutr-info">
                                <tr>
                                    <th>Upvotes:</th>
                                    <th>Downvotes:</th>
                                    <th>Clicks:</th>
                                    <th>Views:</th>
                                </tr>
                                <tr>
                                    <td>${data.direct[index].upVotes}</td>
                                    <td>${data.direct[index].downVotes}</td>
                                    <td>${data.direct[index].clickCount}</td>
                                    <td>${data.direct[index].viewCount}</td>
                                </tr>
                            </table>
                            <div class="rbutr-footer"><small>
                                Created on ${data.direct[index].creationDate}
                                by <a href="${this.serverDomain}/rbutr/LoginServlet?requestType=userPage&personId=${data.direct[index].person.id}">${data.direct[index].person.username}</a>
                            </small></div>
                        </div>
                    `;
                }
            }
            if (data.general.length > 0) {
                for (let index in data.general) {

                    messageTemplate += `
                        <div class="rbutr-message">
                            ${rbutrLogo}
                            <table>
                                <tr>
                                    <th>Rebutted:</th>
                                    <td>
                                        <h6>${data.general[index].fromPage.title}</h6>
                                        <a href="${data.general[index].fromPage.url}">${data.general[index].fromPage.url}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Rebuttal:</th>
                                    <td>
                                        <h6>${data.general[index].toPage.title}</h6>
                                        <a href="${data.general[index].toPage.url}">${data.general[index].toPage.url}</a>
                                    </td>
                                </tr>
                            </table>

                            <table class="rbutr-info">
                                <tr>
                                    <th>Upvotes:</th>
                                    <th>Downvotes:</th>
                                    <th>Clicks:</th>
                                    <th>Views:</th>
                                </tr>
                                <tr>
                                    <td>${data.general[index].upVotes}</td>
                                    <td>${data.general[index].downVotes}</td>
                                    <td>${data.general[index].clickCount}</td>
                                    <td>${data.general[index].viewCount}</td>
                                </tr>
                            </table>
                            <div class="rbutr-footer"><small>
                                Created on ${data.general[index].creationDate}
                                by <a href="${this.serverDomain}/rbutr/LoginServlet?requestType=userPage&personId=${data.general[index].person.id}">${data.general[index].person.username}</a>
                            </small></div>
                        </div>
                    `;
                }
            }
        } else {
            messageTemplate += `
                <div class="rbutr-message">
                    ${rbutrLogo}
                    <h6>This Link has no rebuttals.</h6>
                </div>`;
        }

        return messageTemplate;
    },



    /**
     * @description Get data from server by url
     *
     * @method getRbutrData
     * @param {string} url
     * @param {object} $element
     * @param {function} callback
     * @return {void}
     */
    getRbutrData: function (url, $element, callback) {

        $.get(content.serverUrl, {
            getLinks: true,
            fromPageUrlHash: b64_md5(url),
            version: content.version,
            cid: content.cid,
            json: true
        }, 'json').done( function (data) {
            callback(data, $element);
        });
    },



    /**
     * @description Target and modify platform post based on platform config
     *
     * @method setAlertOnPosts
     * @param {void}
     * @return {boolean}
     */
    setAlertOnPosts: function () {

        'use strict';

        var
            index = 0,
            itemSelectors = content.platform.config.itemSelectors,
            $linkWrapper = {},
            ownHostRegExp = new RegExp(window.location.host),
            expandedUrl;

        for (index in itemSelectors) {

            var
                parentSelector = itemSelectors[index].parent,
                bodySelector = itemSelectors[index].body;

            $(parentSelector + ' ' + bodySelector + ':not([data-rbutr-processed]) a').each(function () {
                // exclude links that have the same hostname
                if (ownHostRegExp.test(this.href) === false) {
                    $linkWrapper = $(this).closest(bodySelector);
                    if ($linkWrapper.attr('data-rbutr-processed') !== 'true') {
                        var
                            $currentLink = $(this),
                            messageTemplate = '';

                        expandedUrl = content.platform.expandExternalLinks($currentLink);

                        if(expandedUrl) {
                            content.getRbutrData(expandedUrl, $linkWrapper, function (result, $element) {
                                messageTemplate = content.createMessageTemplate(result);
                                $element.before($('<div class="rbutr-message-container"></div>').html(messageTemplate));
                            });
                            $linkWrapper.attr('data-rbutr-processed', true);
                        }
                    }
                }
            });
        }

        return true;
    },



    /**
     * @description Turn on the mutation observer
     *
     * @method observe
     * @param {void}
     * @return {void}
     */
    observe: function () {

        'use strict';

        var
            observerRoot = content.platform.config.observer.root,
            observerRootObj = document.querySelector(observerRoot),
            //observerFilter = content.platform.config.observer.filter,

            observerConfig = {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            };


        this.mutationObserver = new MutationObserver(function(mutations, thisInstance) {
            var result = content.setAlertOnPosts();
            if(result === true) {
                thisInstance.disconnect();
                content.execute();
            }
        });

        this.mutationObserver.observe(observerRootObj, observerConfig);
    },



    /**
     * @description Execute the script
     *
     * @method execute
     * @param {void}
     * @return {void}
     */
    execute: function () {

        'use strict';

        window.setTimeout(content.observe, 1000);
        window.setTimeout(content.setAlertOnPosts, 2000);
    }
};



const content = new Content();

document.onreadystatechange = function () {

    'use strict';

    if (document.readyState == 'complete') {

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
                    }, 5000);

                    $('#dontShowAgain').click(function () {
                        localStorage.setItem('rbutr.dontshow.' + request.url, $('#dontShowAgain')[0].checked);
                    });
                }
            }

            return true;
        });



        // When the user clicks through from our webpage, rather than the plugin, we hide the click details in the re-direct page.
        if ($('#clickDataForRbutrPlugin').length) { // jQuery never returns null.. http://stackoverflow.com/questions/477667/how-to-check-null-objects-in-jquery
            var click = JSON.parse($('#clickDataForRbutrPlugin').text());
            browser.runtime.sendMessage({'action': 'setClick', 'click': click});
        }


        $('body').append('<div id="rbutr-installed"></div>');
        content.execute();
    }
};
