/*!
 * Rbutr Browser Extension v0.10.0
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global browser,$,MutationObserver*/
/*jslint browser:true,esnext:true */


const FIRST_ARRAY_ELEMENT = 0;
let tab;


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


    return {initialize, add, remove};
};



/**
 * @method View
 * @description Composed object handling views
 *
 * @return {Object} Public object methods
 */
const View = () => {

    'use strict';



    /**
     * @method get
     * @description Retrieve view DOM object
     *
     * @param {String} view - Name of the view to retrieve
     * @return {(Boolean|Object)} Return DOM object if exists, otherwise false
     */
    const get = (view) => {

        const $viewObj = document.getElementById('view-' + view);

        if (typeof $viewObj === 'object' && $viewObj !== null) {
            return $viewObj;
        } else {
            rbutr.utils.log('error', `View "${view}" does not exist.`);
            return false;
        }
    };



    /**
     * @method show
     * @description Display given popup view
     *
     * @param {String} view - Name of the view to display
     * @return {void}
     */
    const show = (view) => {

        rbutr.utils.log('log', 'Show view: ', view);

        get(view).classList.remove('hidden');
    };



    /**
     * @method hide
     * @description Hide given popup view
     *
     * @param {?String} view - Name of the view to hide
     * @return {void}
     */
    const hide = (view) => {

        rbutr.utils.log('log', 'Hide view: ', view);

        if (view === 'all' || view === null) {
            document.querySelectorAll('.view').forEach( x => x.classList.add('hidden'));
        } else {
            get(view).classList.add('hidden');
        }
    };



    /**
     * @method setContent
     * @description Hide given popup view
     *
     * @param {?String} view - Name of the view
     * @param {?String} content - HTML that should be set in given view
     * @return {void}
     */
    const setContent = (view, content) => {

        if (view === 'menu' || view === 'rebuttals') {
            get(view).innerHTML = content;
        } else {
            rbutr.utils.log('error', `It's not allowed to overwrite the content of view "${view}"`);
        }
    };


    return {get, show, hide, setContent};
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
    const MAX_TAG_COUNT = 6;
    const MAX_URL_COUNT = 3;

    let notLoggedInMsg = '';

    const msg = Message();
    msg.initialize();

    const view = View();



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
            <a target="_blank" href="${rbutr.api.getServerUrl(true)}/rbutr/LoginServlet">
                Click here
            </a> to login or register.
        `;

        // Request Menu from Server
        portBg.postMessage({request: 'getMenu'});

        // Request rebuttals from Server
        let rebuttals = rbutr.getProp('rebuttals', tab.id);

        if (rebuttals === null) {
            view.setContent('rebuttals', 'Loading...');
            portBg.postMessage({request: 'getRebuttals', tab: tab});
        } else {
            view.setContent('rebuttals', rebuttals);
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
            $('#submit-sources').html('<h3 class="source-heading">Rebut these sources</h3>');
        } else {
            $('#submit-sources').html('<h3 class="source-heading">Rebut this source</h3>');
        }

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
            prefetch: rbutr.api.getServerUrl() + '?getPlainTagsJson=true'
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

        view.hide('all');
        view.show('submission');
        refreshTags();
        setupTagTypeahead();
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
            view.show('thankyou');
        } else {
            view.show('vote');
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
            rbutr.startSubmission(tab.id, fromTo);
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
        view.show('rebuttals');
        view.show('action');
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
            view.hide('all');
            view.show('request');
            setupTagTypeahead();
            $('#request-url').val(rbutr.getProp('canonicalUrls', tab.id));
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

        $.post(rbutr.api.getServerUrl(), {
            subscribeToPage: rbutr.getProp('canonicalUrls', tab.id),
            title: rbutr.getProp('pageTitle', rbutr.getProp('canonicalUrls', tab.id)),
            tags: rbutr.getProp('tags'),
            pageIsCanonical: rbutr.getProp('urlIsCanonical', rbutr.getProp('canonicalUrls', tab.id)),
            cid: rbutr.api.getCid()
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

        if (rbutr.getProp('canonicalUrls', tab.id) === undefined || rbutr.alreadyExists(rbutr.getProp('canonicalUrls', tab.id))) {
            return;
        } else {
            rbutr.setProp('toUrls', rbutr.getPropLen('toUrls'), rbutr.getProp('canonicalUrls', tab.id));
            refreshSubmissionData();
        }
    };



    /**
     * @method fromTagged
     * @description Add canonical url to stored fromUrl list and refresh data
     *
     * @return {void}
     */
    const fromTagged = () => {

        if (rbutr.getProp('canonicalUrls', tab.id) === undefined || rbutr.alreadyExists(rbutr.getProp('canonicalUrls', tab.id))) {
            return;
        } else {
            rbutr.setProp('fromUrls', rbutr.getPropLen('fromUrls'), rbutr.getProp('canonicalUrls', tab.id));
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

        view.hide('all');
        view.show('rebuttals');
        view.show('action');
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

        rbutr.submitRebuttals(tab.id);
    };



    /**
     * @method loadData
     * @description Load recorded click data
     *
     * @return {void}
     */
    const loadData = () => {

        // Loads the data from the background tab, which has likely already retrieved it.
        let recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tab.id));
        if (rbutr.getProp('submittingRebuttal') === true) {
            displaySubmissionForm();

            // This means we are on a rebuttal we clicked through to.
        } else if (recordedClick && recordedClick !== null) {
            $('.voting-rebutted-url').attr('href', recordedClick.linkFromUrl);
            $('#current-score').html(recordedClick.score);
            displayVoteForm(recordedClick);
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

        let recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tab.id));

        if(recordedClick !== null) {
            $.get(rbutr.api.getServerUrl(), {
                'linkId': recordedClick.linkId,
                'vote': voteScore,
                'cid': rbutr.api.getCid()
            }, (data) => {
                $('#current-score').html(data);
            });
            recordedClick.score += voteScore;
            recordedClick.yourVote = voteScore;
            view.show('thankyou');
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

        const $ideaForm = document.forms['idea-form'];

        $ideaForm.submitLink.value = 'Please wait..';
        $ideaForm.submitLink.disabled = true;

        portBg.postMessage({
            request: 'submitIdea',
            tab: tab,
            data: $ideaForm.idea.value,
        });
    };



    /**
     * @description Set up event listeners
     */
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

            const menu = document.querySelector('.menu');
            menu.classList.toggle('active');

            if (menu.classList.contains('active')) {
                menu.innerHTML = 'close';
                view.hide('all');
                view.show('menu');
            } else {
                menu.innerHTML = 'Menu';
                view.hide('menu');
                view.show('rebuttals');
                view.show('action');
            }
        })
        .on('submit', '#idea-form', submitIdea)
        .on('submit', '#data', submitData)
        .on('submit', '#request-rebuttal', submitRequestData)
        .on('click', '#cancel-submission', cancelSubmission)
        .on('click', '#cancel-rebuttal-request', cancelRequestSubmission)
        .on('change', '#direct', () => {
            rbutr.setProp('direct', null, this.checked);
        })
        .on('click', '#requestRebuttals', requestRebuttals)
        // Hook up the clickable stuff that might come back.
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
            view.show('rebuttals');
            view.show('action');
        });



    /**
     * @method execute
     * @description Start execution in popup
     *
     * @return {void}
     */
    const execute = () => {

        /**
         * @description Set canonical url in background
         */

        if (!rbutr.getProp('canonicalUrls', tab.id)) {
            browser.runtime.sendMessage({action: 'setCanonical', tab: tab});
        }

        loadData();
    };

    return {initialize, msg, view, execute};
};



/**
 * @description Make current tab context globally available
 */
browser.tabs.query({currentWindow: true, active: true}, (currentTab) => {
    tab = currentTab[FIRST_ARRAY_ELEMENT];
});



/**
 * @description Prepare popup to be executed
 */
const popup = Popup();
let rbutr = {};


browser.runtime.getBackgroundPage((background) => {
    rbutr = background.rbutr;

    popup.initialize();
    popup.execute();
});


const portBg = browser.runtime.connect({name: 'popup-background'});

portBg.onMessage.addListener((msg) => {
    if (msg.response === 'getRebuttals') {

        //TODO: Fix this
        if (!rbutr.getProp('canonicalUrls', tab.id)) {
            msg.add('error', 'This doesn\'t look like a real web page.');
            return;
        }

        if (msg.status === 'success') {
            popup.view.setContent('rebuttals', msg.result);
            popup.view.hide('all');
            popup.view.show('rebuttals');
            popup.view.show('action');
        } else if (msg.status === 'error') {
            popup.view.setContent('rebuttals', '');
            popup.msg.add('error', msg.result);
        }

    } else if (msg.response === 'submitRebuttals') {
        if (msg.status === 'success') {
            window.open(msg.result.redirectUrl);
            popup.cancelSubmission(); // Clear the data now that it's submitted.
        } else if (msg.status === 'error') {
            popup.msg.add('error', msg.result);
        }

    } else if (msg.response === 'getMenu') {
        if (msg.status === 'success') {
            popup.view.setContent('menu', msg.result);
        } else if (msg.status === 'error') {
            popup.view.setContent('menu', '');
            popup.msg.add('error', msg.result);
        }

    } else if (msg.response === 'submitIdea') {
        if (msg.status === 'success') {
            popup.msg.add('info', msg.result);
        } else if (msg.status === 'error') {
            popup.msg.add('error', msg.result);
        }
    }
});
