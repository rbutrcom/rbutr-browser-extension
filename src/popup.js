/*!
 * Rbutr Browser Extension v0.10.0
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global browser,$,MutationObserver*/
/*jslint browser:true,esnext:true */


let waitCount;
let tabId;


/**
 * @description Multi-Browser support
 */
window.browser = (function () {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();



/**
 * @method Message
 * @description Composed object handling messages
 *
 * @return {Object} Public object methods
 */
const Message = () => {

    'use strict';

    const $messageContainer = document.getElementById('messages');


    /**
     * @method initialize
     * @description Initialize Message handler
     *
     * @return {void}
     */
    const initialize = () => {

        window.addEventListener('click', (event) => {
            if (event.target.className === 'msg-remove') {
                remove(event.target.parentNode);
            }
        });
    };



    /**
     * @method add
     * @description Add given message to message container
     *
     * @param {String} type - The message type (success|info|warning|error)
     * @param {String} message - The message to be displayed
     * @return {void}
     */
    const add = (type, message) => {

        if (type === 'success' || type === 'info' || type === 'warning' || type === 'error') {
            const messageClose = '<a href="#" class="msg-remove">&times;</a>';
            const $newMessage = document.createElement('div');

            $newMessage.setAttribute('class', 'msg msg-' + type);
            $newMessage.insertAdjacentHTML('beforeend', messageClose + message);

            $messageContainer.appendChild($newMessage);
        } else {
            rbutr.utils.log('warn', `Message of type "${type}" is invalid.`);
        }
    };



    /**
     * @method remove
     * @description Remove message from message container
     *
     * @param {Object} $element - The element to be removed
     * @return {void}
     */
    const remove = ($element) => {

        $messageContainer.removeChild($element);
    };



    /**
     * @method displayNotLoggedInMessage
     * @description Display message if user is not logged in
     *
     * @return {void}
     */
    /*const displayNotLoggedInMessage = () => {

        msg.add('You are not logged in! rbutr requires you to be logged in to submit rebuttals and to vote. ' +
            'Click <a target="_blank" href="' + rbutr.utils.getServerUrl(true) + '/rbutr/LoginServlet">here</a> to login or register.');
    };*/

    return {initialize, add, remove};
};



/**
 * @method Popup
 * @description Composed object handling all popup and view logic
 *
 * @return {Object} Public object methods
 */
const Popup = () => {

    'use strict';

    const ZERO = 0;
    const ONE = 1;
    const FIRST_ARRAY_ELEMENT = 0;
    const MAX_TAG_COUNT = 6;
    const MAX_URL_COUNT = 3;

    let notLoggedInMsg = '';

    const msg = Message();
    msg.initialize();



    /**
     * @method initialize
     * @description Initialize popup
     *
     * @return {void}
     */
    const initialize = () => {

        notLoggedInMsg = `
            You are not logged in!
            rbutr requires you to be logged in to submit rebuttals and to vote.
            <a target="_blank" href="${rbutr.utils.getServerUrl(true)}/rbutr/LoginServlet">
                Click here
            </a> to login or register.
        `;

        getView('rebuttals').innerHTML = rbutr.getProp('rebuttals', tabId);

        getMenu((success, result) => {
            if (success === true) {
                getView('menu').innerHTML = result;
            } else {
                msg.add('error', result);
            }

        });
    };



    /**
     * @method getView
     * @description Retrieve view DOM object
     *
     * @param {String} view - Name of the view to retrieve
     * @return {(Boolean|Object)} Return DOM object if exists, otherwise false
     */
    const getView = (view) => {

        const $viewObj = document.getElementById('view-' + view);

        if (typeof $viewObj === 'object' && $viewObj !== null) {
            return $viewObj;
        } else {
            rbutr.utils.log('error', `View "${view}" does not exist.`);
            return false;
        }
    };



    /**
     * @method showView
     * @description Display given popup view
     *
     * @param {String} view - Name of the view to display
     * @return {void}
     */
    const showView = (view) => {

        rbutr.utils.log('log', 'Show view: ', view);

        getView(view).removeAttribute('class', 'hidden');
    };



    /**
     * @method hideView
     * @description Hide given popup view
     *
     * @param {?String} view - Name of the view to hide
     * @return {void}
     */
    const hideView = (view) => {

        rbutr.utils.log('log', 'Hide view: ', view);

        if (view === 'all' || view === null) {
            document.querySelectorAll('.view').forEach( x => x.setAttribute('class','hidden'));
        } else {
            getView(view).setAttribute('class', 'hidden');
        }
    };



    /**
     * @method refreshSubmissionData
     * @description Refresh stored data certain user interactions
     *
     * @return {void}
     */
    const refreshSubmissionData = () => {

        const HTTP_LENGTH = 4;

        if (rbutr.getPropLen('fromUrls') > ONE) {
            $('#submit-sources').html('<h3 class="source-heading">Rebut these sources</h3><div class="menu-wrap"><div class="menu">Menu</div></div>');
        } else {
            $('#submit-sources').html('<h3 class="source-heading">Rebut this source</h3><div class="menu-wrap"><div class="menu">Menu</div></div>');
        }
        // This data lives in the background so it can be shared between tabs (popups are one per tab)

        for (let i = 0; i < rbutr.getPropLen('fromUrls'); i++) {
            let url = rbutr.getProp('fromUrls', i);
            let source = $('<div class="link-block" id="source_' + i +
                '"><span class="link-title">' + rbutr.getPageTitle(url) + '</span><br>' +
                '<span class="link-url">' + url + '</span></div>').appendTo('#submit-sources');
            $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="s_x_' + i + '"/>').click((event) => {
                event.preventDefault();
                event.stopPropagation();
                rbutr.setProp('fromUrls', i, null);
                refreshSubmissionData();
            }).appendTo(source);
        }

        if (rbutr.getPropLen('fromUrls') > ZERO) {
            $('#submit-sources').append('<div id="btn-capture-src" class="fake-link">+ add another source</div>');
        } else {
            $('#submit-sources').append('<div id="btn-capture-src" class="btn">Click to capture current page as source link.</div>');
        }

        if (rbutr.getPropLen('toUrls') > ONE) {
            $('#submit-rebuttals').html('<h3 class="rebuttalHeading">With these pages</h3><div style="clear:both"></div>');
        } else {
            $('#submit-rebuttals').html('<h3 class="rebuttalHeading">With this page</h3><div style="clear:both"></div>');
        }

        for (let j = 0; j < rbutr.getPropLen('toUrls'); j++) {
            let toUrl = rbutr.getProp('toUrls', j);
            let rebuttal = $(
                '<div class="link-block" id="rebuttal_' + j +
                '"><span class="link-title">' + rbutr.getPageTitle(toUrl) + '</span><br>' +
                '<span class="link-url">' + toUrl + '</span><br>' +
                '</div>').appendTo('#submit-rebuttals');
            $('<input id="c_x_' + j +
                '" size="60" type="text" placeholder="Optional : Describe the relationship between these two pages in a few words" ' +
                'name="c_x_' + j + '">')
                .val(rbutr.getProp('comment', j))
                .on('keyup', () => {
                    rbutr.setProp('comment', j, this.value);
                })
                .appendTo(rebuttal);
            $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="r_x_' + j + '">').click((event) => {
                event.preventDefault();
                event.stopPropagation();
                rbutr.setProp('toUrls', j, null);
                refreshSubmissionData();
            }).appendTo(rebuttal);
        }

        if (rbutr.getPropLen('toUrls') >= MAX_URL_COUNT) {
            $('#btn-capture-rebuttal').disable();
        } else if (rbutr.getPropLen('toUrls') > ZERO) {
            $('#submit-rebuttals').append('<div id="btn-capture-rebuttal" class="fake-link">+ add another rebuttal</div>');
        } else {
            $('#submit-rebuttals').append('<div id="btn-capture-rebuttal" class="button">Click to capture current page as rebuttal link.</div>');
        }

        $('#btn-capture-rebuttal').click(() => {
            toTagged();
        });

        $('#submission-error').text(rbutr.getProp('submitError'));

        if (rbutr.getPropLen('fromUrls') > ZERO &&
            rbutr.getProp('fromUrls', FIRST_ARRAY_ELEMENT).substring(ZERO, HTTP_LENGTH).toLowerCase() === 'http' &&
            rbutr.getPropLen('toUrls') > ZERO &&
            rbutr.getProp('toUrls', FIRST_ARRAY_ELEMENT).substring(ZERO, HTTP_LENGTH).toLowerCase() === 'http' &&
            rbutr.getPropLen('tags') > ZERO) {
            document.forms['data'].submitLink.title = 'Submit this rebuttal';
            document.forms['data'].submitLink.disabled = false;
        } else {
            document.forms['data'].submitLink.title = 'You must have at least one source link, rebuttal link and tag to submit';
            document.forms['data'].submitLink.disabled = true;
        }
    };



    /**
     * @method refreshTags
     * @description Refresh stored tags
     *
     * @return {void}
     */
    const refreshTags = () => {

        $('#tag-holder').html(''); // Wipe and recreate
        for (let i = 0; i < rbutr.getPropLen('tags'); i++) {
            $('#tag-holder').append('<a class="tag-for-submission" href="#">' + rbutr.getProp('tags', i) + '</a>');
        }
        $('.tag-for-submission').click(() => {
            rbutr.removeTag(this.text);
            refreshTags();
            $('#tag-typeahead').val(''); // Somehow this gets reset on removing the actual tags?
            refreshSubmissionData();
        });
    };



    /**
     * @method recordTag
     * @description Add tag to taglist and refresh stored data
     *
     * @param {String} tagText - Content of the tag
     * @return {void}
     */
    const recordTag = (tagText) => {

        // We are getting blank ones due to double ups of events. This is the easy fix.
        if (tagText === '') {
            return;
        }
        rbutr.addTag(tagText);
        refreshTags();
        refreshSubmissionData();
    };



    /**
     * @method setupTagTypeahead
     * @description Setup typeahead autocomplete library
     *
     * @return {void}
     */
    const setupTagTypeahead = () => {

        const KEY_ENTER = 13;
        const KEY_SEMICOLON = 186;
        const KEY_COMMA = 188;

        $('#tag-typeahead').typeahead({
            name: 'tags',
            limit: 10,
            prefetch: rbutr.utils.getServerUrl() + '?getPlainTagsJson=true'
            // local: rbutr.getTagsData()
        }).on('typeahead:selected', (event, data) => {
            recordTag(data.value);
            document.getElementById('#tag-typeahead').value = '';
        }).keydown((event) => {
            const key = event.which;
            rbutr.utils.log('log', 'Tagging pressed key:', key);
            rbutr.utils.log('log', 'Tagging event:', event);

            if (key === KEY_ENTER || key === KEY_SEMICOLON || key === KEY_COMMA) {
                event.preventDefault();
                recordTag($('#tag-typeahead').val());
                $('#tag-typeahead').val('');
            }
        });
    };



    /**
     * @method displaySubmissionForm
     * @description Prepare and display submission page
     *
     * @return {void}
     */
    const displaySubmissionForm = () => {

        hideView('all');
        showView('submission');
        refreshTags();
        setupTagTypeahead();

        $('#start-submission').hide();
        refreshSubmissionData();
    };



    /**
     * @method displayVoteForm
     * @description Show voting page if no votes have been made, otherwise thankyou page
     *
     * @param {Object} recordedClick - Object which holds voting click data
     * @return {void}
     */
    const displayVoteForm = (recordedClick) => {

        if (recordedClick.yourVote && recordedClick.yourVote !== ZERO) {
            showView('thankyou');
        } else {
            showView('vote');
        }
    };



    /**
     * @method showSubmissionPopup
     * @description Display submission page if user is logged in
     *
     * @param {String} fromTo - Type of URL that should be submitted
     * @return {void}
     */
    const showSubmissionPopup = (fromTo) => {

        if (!rbutr.getProp('loggedIn')) {
            msg.add('warning', notLoggedInMsg);
        } else {
            rbutr.startSubmission(tabId, fromTo);
            displaySubmissionForm();
        }
    };



    /**
     * @method cancelSubmission
     * @description Stop submission and close popup
     *
     * @return {void}
     */
    const cancelSubmission = () => {

        rbutr.stopSubmission();
        window.close();
    };



    /**
     * @method requestRebuttals
     * @description Display rebuttal request page
     *
     * @return {void}
     */
    const requestRebuttals = () => {

        if (!rbutr.getProp('loggedIn')) {
            msg.add('warning', notLoggedInMsg);
        } else {
            showView('request');
            setupTagTypeahead();
            $('#request-url').val(rbutr.getProp('canonicalUrls', tabId));
            $('#start-submission').hide();
        }
    };



    /**
     * @method submitRequestData
     * @description Submit rebuttal request data to server
     *
     * @return {Boolean} Returns false if preconditions are not correct
     */
    const submitRequestData = () => {

        if (rbutr.getPropLen('tags') > MAX_TAG_COUNT) {
            document.forms['request-rebuttal'].submitLink.value = 'Maximum of 6 tags, please fix before submitting.';
            document.forms['request-rebuttal'].submitLink.disabled = false;
            return false;
        }
        $.post(rbutr.utils.getServerUrl(), {
            subscribeToPage: rbutr.getProp('canonicalUrls', tabId),
            title: rbutr.getProp('pageTitle', rbutr.getProp('canonicalUrls', tabId)),
            tags: rbutr.getProp('tags'),
            pageIsCanonical: rbutr.getProp('urlIsCanonical', rbutr.getProp('canonicalUrls', tabId)),
            cid: rbutr.getCid()
        }, (data) => {
            rbutr.utils.log('debug', 'Submit request success:', data);
            msg.add('info', data);
        }).fail((msg) => {
            rbutr.utils.log('debug', 'Submit request fail:', msg);
            msg.add('error', msg.responseText);
        });
    };



    /**
     * @method toTagged
     * @description Add canonical url to stored toUrl list and reresh data
     *
     * @return {void}
     */
    const toTagged = () => {

        if (rbutr.getProp('canonicalUrls', tabId) === undefined || rbutr.alreadyExists(rbutr.getProp('canonicalUrls', tabId))) {
            return;
        } else {
            rbutr.setProp('toUrls', rbutr.getPropLen('toUrls'), rbutr.getProp('canonicalUrls', tabId));
            refreshSubmissionData();
        }
    };



    /**
     * @method fromTagged
     * @description Add canonical url to stored fromUrl list and reresh data
     *
     * @return {void}
     */
    const fromTagged = () => {

        if (rbutr.getProp('canonicalUrls', tabId) === undefined || rbutr.alreadyExists(rbutr.getProp('canonicalUrls', tabId))) {
            return;
        } else {
            rbutr.setProp('fromUrls', rbutr.getPropLen('fromUrls'), rbutr.getProp('canonicalUrls', tabId));
            refreshSubmissionData();
        }
    };



    /**
     * @method cancelRequestSubmission
     * @description Return from request to submission page
     *
     * @return {void}
     */
    const cancelRequestSubmission = () => {

        $('#start-submission').show();
        showView('rebuttals');
    };



    /**
     * @method submitData
     * @description Submit data
     *
     * @return {Boolean} Returns false if preconditions are not correct
     */
    const submitData = () => {

        if (rbutr.getPropLen('tags') > MAX_TAG_COUNT) {
            rbutr.setProp('submitError', null, 'Maximum of 6 tags, please fix before submitting.');
            return false;
        }
        if (rbutr.getPropLen('tags') === ZERO) {
            rbutr.setProp('submitError', null, 'Please enter at least one tag for this rebuttal.');
            return false;
        }
        browser.tabs.get(tabId, (tab) => {
            rbutr.submitRebuttals(tab);
        });
    };



    /**
     * @method handleDelayOnLoadOfRebuttals
     * @description Recursively sleep until the rebuttal data is ready
     *
     * @return {void}
     */
    const handleDelayOnLoadOfRebuttals = () => {

        const DELAY = 50;
        const TIMEOUT = 100;

        setTimeout(() => {
            // not yet ready.
            if (rbutr.getProp('rebuttals', tabId) === null) {
                waitCount++;
                if (waitCount < DELAY) {
                    // Recurse
                    handleDelayOnLoadOfRebuttals();
                    return;
                }
                if (!rbutr.getProp('canonicalUrls', tabId)) {
                    msg.add('error', 'This doesn\'t look like a real web page.');
                    return;
                }
                msg.add('error', 'Server connection timed out, try again.');
            } else {
                showView('rebuttals');
            }
        }, TIMEOUT);
    };



    /**
     * @method loadData
     * @description Load recorded click data
     *
     * @return {void}
     */
    const loadData = () => {

        // Loads the data from the background tab, which has likely already retrieved it.
        let recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tabId));
        if (rbutr.getProp('submittingRebuttal') === true) {
            displaySubmissionForm();

            // This means we are on a rebuttal we clicked through to.
        } else if (recordedClick && recordedClick !== null) {
            $('.voting-rebutted-url').attr('href', recordedClick.linkFromUrl);
            $('#current-score').html(recordedClick.score);
            displayVoteForm(recordedClick);
        }

        // Don't show current rebuttals if adding, too messy.
        if (!rbutr.getProp('submittingRebuttal')) {
            // Needs to be set for following call which is recursive
            waitCount = ZERO;
            handleDelayOnLoadOfRebuttals();
        }
    };



    /**
     * @method vote
     * @description Update vote score with given value
     *
     * @param {Number} voteScore - Integer representing the score of a URL
     * @return {void}
     */
    const vote = (voteScore) => {

        let recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tabId));

        if(recordedClick !== null) {
            $.get(rbutr.utils.getServerUrl(), {
                'linkId': recordedClick.linkId,
                'vote': voteScore,
                'cid': rbutr.getCid()
            }, (data) => {
                $('#current-score').html(data);
            });
            recordedClick.score += voteScore;
            recordedClick.yourVote = voteScore;
            showView('thankyou');
        }
    };



    /**
     * @method voteUp
     * @description Increment vote score
     *
     * @return {void}
     */
    const voteUp = () => {

        vote(ONE);
    };



    /**
     * @method voteDown
     * @description Decrement vote score
     *
     * @return {void}
     */
    const voteDown = () => {

        vote(-ONE);
    };



    /**
     * @method submitIdea
     * @description Submit rebuttal idea to the server
     *
     * @return {void}
     */
    const submitIdea = () => {

        document.forms['idea-form'].submitLink.value = 'Please wait..';
        document.forms['idea-form'].submitLink.disabled = true;
        $.post(rbutr.utils.getServerUrl(), {
            url: rbutr.getProp('canonicalUrls', tabId),
            title: rbutr.getProp('pageTitle', rbutr.getProp('canonicalUrls', tabId)),
            idea: document.forms['idea-form'].idea.value,
            cid: rbutr.getCid()
        }).success((data) => {
            msg.add('info', data);
        }).error((msg) => {
            msg.add('error', msg.responseText);
        });
    };



    /**
     * @method getMenu
     * @description Load menu from server
     *
     * @param {Function} callback - Function to handle the result
     * @return {void}
     */
    const getMenu = (callback) => {

        $.get(rbutr.utils.getServerUrl(), {
            getMenu: true,
            version: browser.runtime.getManifest().version,
            cid: rbutr.getCid()
        }).success((data) => {
            callback(true, data);
        }).error((msg) => {
            callback(false, msg.responseText);
        });
    };



    /**
     * @description Set up event listeners
     */
    // As per http://developer.browser.com/extensions/contentSecurityPolicy.html
    $(document)
        .on('click', '#tagTo', toTagged)
        .on('click', '#tagFrom', fromTagged)
        .on('click', '.btn-rebuttal', () => {
            showSubmissionPopup('to');
        })
        .on('click', '.btn-rebutted', () => {
            showSubmissionPopup('from');
        })
        .on('click', '.clickable-down', voteDown)
        .on('click', '.clickable-up', voteUp)
        .on('click', '.menu', () => {
            hideView('all');
            showView('menu');
        })
        .on('submit', '#idea-form', submitIdea)
        .on('submit', '#data', submitData)
        .on('submit', '#request-rebuttal', submitRequestData)
        .on('click', '#cancel-submission', cancelSubmission)
        .on('click', '#cancel-rebuttal-request', cancelRequestSubmission)
        .on('change', '#direct', () => {
            rbutr.setProp('direct', null, this.checked);
        })
        .on('click', '#requestRebuttals', requestRebuttals)  // Hook up the clickable stuff that might come back.
        .on('click', '#directShowLink', () => {
            $('#hiddenDirects').show();
            $('#directShower').hide();
            return false;
        })
        .on('click', '#generalShowLink', () => {
            $('#hiddenGenerals').show();
            $('#generalShower').hide();
            return false;
        })
        .on('click', '#directHideLink', () => {
            $('#hiddenDirects').hide();
            $('#directShower').show();
            return false;
        })
        .on('click', '#generalHideLink', () => {
            $('#hiddenGenerals').hide();
            $('#generalShower').show();
            return false;
        })
        .on('click', '#btn-capture-src', fromTagged)
        .on('click', '#thanks', () => {
            window.close();
        });


    const execute = () => {
        /**
         * @description Set canonical url in background
         */
        /** @namespace rbutr.fromUrls */
        /** @namespace rbutr.toUrls */
        browser.tabs.query({currentWindow: true, active: true}, (tab) => {

            // This happens AFTER document.ready, so I'll do everything here, which means I get access to the URL
            tabId = tab[FIRST_ARRAY_ELEMENT].id;

            if (!rbutr.getProp('canonicalUrls', tabId)) {
                browser.runtime.sendMessage({action: 'setCanonical', tab: tab[FIRST_ARRAY_ELEMENT]});
            }

            loadData();
        });
    };

    return {initialize, msg, execute};
};


const popup = Popup();
let rbutr = {};

browser.runtime.getBackgroundPage((background) => {
    rbutr = background.rbutr;

    popup.initialize();
    popup.execute();
});


