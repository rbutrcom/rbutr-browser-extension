/*global browser,$,MutationObserver,RbutrUtils*/
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



const ZERO = 0;
const ONE = 1;
const FIRST_ARRAY_ELEMENT = 0;
const MAX_TAG_COUNT = 6;
const MAX_URL_COUNT = 3;

const rbutrUtils = RbutrUtils();
const rbutr = browser.extension.getBackgroundPage().rbutr;



/**
 * @method setPage
 * @description Toggle currently displayed popup page
 *
 * @param {String} page - Name of the page/view to display
 * @return {void}
 */
function setPage(page) {

    'use strict';
    rbutrUtils.log('debug', 'show page: ', page);

    // clear all message
    document.querySelector('#message').innerHTML = '';

    if (page === 'rebuttals') {
        $('#message').html(rbutr.getProp('rebuttals', tabId));
    } else {
        document.querySelectorAll('#popupContent > div').forEach( x => x.setAttribute('class','hide'));
        document.querySelector('#view-' + page).removeAttribute('class', 'hide');
    }
}



/**
 * @method appendPage
 * @description Append page to currently displayed popup page
 *
 * @param {String} page - Name of the page/view to display
 * @return {void}
 */
function appendPage(page) {

    'use strict';
    document.querySelector('#popupContent > ' + '#view-' + page).removeAttribute('class', 'hide');
}



/**
 * @method refreshSubmissionData
 * @description Refresh stored data certain user interactions
 *
 * @return {void}
 */
function refreshSubmissionData() {

    'use strict';

    const HTTP_LENGTH = 4;

    if (rbutr.getPropLen('fromUrls') > ONE) {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut these sources</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    } else {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut this source</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    }
    // This data lives in the background so it can be shared between tabs (popups are one per tab)

    for (let i = 0; i < rbutr.getPropLen('fromUrls'); i++) {
        let url = rbutr.getProp('fromUrls', i);
        let source = $('<div class="linkBlock" id="source_' + i +
            '"><span class="linkTitle">' + rbutr.getPageTitle(url) + '</span><br>' +
            '<span class="linkUrl">' + url + '</span></div>').appendTo('#submitSources');
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="s_x_' + i + '"/>').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            rbutr.setProp('fromUrls', i, null);
            refreshSubmissionData();
        }).appendTo(source);
    }

    if (rbutr.getPropLen('fromUrls') > ZERO) {
        $('#submitSources').append('<div id="captureSourceButton" class="fakeLink">+ add another source</div>');
    } else {
        $('#submitSources').append('<div id="captureSourceButton" class="button">Click to capture current page as source link.</div>');
    }

    if (rbutr.getPropLen('toUrls') > ONE) {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With these pages</h3><div style="clear:both"></div>');
    } else {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With this page</h3><div style="clear:both"></div>');
    }

    for (let j = 0; j < rbutr.getPropLen('toUrls'); j++) {
        let toUrl = rbutr.getProp('toUrls', j);
        let rebuttal = $(
            '<div class="linkBlock" id="rebuttal_' + j +
            '"><span class="linkTitle">' + rbutr.getPageTitle(toUrl) + '</span><br>' +
            '<span class="linkUrl">' + toUrl + '</span><br>' +
            '</div>').appendTo('#submitRebuttals');
        $('<input id="c_x_' + j +
            '" size="60" type="text" placeholder="Optional : Describe the relationship between these two pages in a few words" ' +
            'name="c_x_' + j + '">')
            .val(rbutr.getProp('comment', j))
            .on('keyup', function () {
                rbutr.setProp('comment', j, this.value);
            })
            .appendTo(rebuttal);
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="r_x_' + j + '">').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            rbutr.setProp('toUrls', j, null);
            refreshSubmissionData();
        }).appendTo(rebuttal);
    }

    if (rbutr.getPropLen('toUrls') >= MAX_URL_COUNT) {
        $('#captureRebuttalButton').disable();
    } else if (rbutr.getPropLen('toUrls') > ZERO) {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="fakeLink">+ add another rebuttal</div>');
    } else {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="button">Click to capture current page as rebuttal link.</div>');
    }

    $('#captureRebuttalButton').click(function () {
        toTagged();
    });

    $('#submitError').text(rbutr.getProp('submitError'));

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
}



/**
 * @method refreshTags
 * @description Refresh stored tags
 *
 * @return {void}
 */
function refreshTags() {

    'use strict';

    $('#tagHolder').html(''); // Wipe and recreate
    for (let i = 0; i < rbutr.getPropLen('tags'); i++) {
        $('#tagHolder').append('<a class="tagForSubmission" href="#">' + rbutr.getProp('tags', i) + '</a>');
    }
    $('.tagForSubmission').click(function () {
        rbutr.removeTag(this.text);
        refreshTags();
        $('#tagTypeahead').val(''); // Somehow this gets reset on removing the actual tags?
        refreshSubmissionData();
    });
}



/**
 * @method recordTag
 * @description Add tag to taglist and refresh stored data
 *
 * @param {String} tagText - Content of the tag
 * @return {void}
 */
function recordTag(tagText) {

    'use strict';

    // We are getting blank ones due to double ups of events. This is the easy fix.
    if (tagText === '') {
        return;
    }
    rbutr.addTag(tagText);
    refreshTags();
    refreshSubmissionData();
}



/**
 * @method setupTagTypeahead
 * @description Setup typeahead autocomplete library
 *
 * @return {void}
 */
function setupTagTypeahead() {

    'use strict';

    const KEY_ENTER = 13;
    const KEY_SEMICOLON = 186;
    const KEY_COMMA = 188;

    $('#tagTypeahead').typeahead({
        name: 'tags',
        limit: 10,
        prefetch: rbutrUtils.getServerUrl() + '?getPlainTagsJson=true'
        // local: rbutr.getTagsData()
    }).on('typeahead:selected', function (event, data) {
        recordTag(data.value);
        document.getElementById('#tagTypeahead').value = '';
    }).keydown(function (event) {
        const key = event.which;
        rbutrUtils.log('debug', 'key = ', key);
        rbutrUtils.log('debug', 'event = ', event);

        if (key === KEY_ENTER || key === KEY_SEMICOLON || key === KEY_COMMA) {
            event.preventDefault();
            recordTag($('#tagTypeahead').val());
            $('#tagTypeahead').val('');
        }
    });
}



/**
 * @method displaySubmissionForm
 * @description Prepare and display submission page
 *
 * @return {void}
 */
function displaySubmissionForm() {

    'use strict';

    setPage('submission');
    refreshTags();
    setupTagTypeahead();

    $('#StartSubmissionDiv').hide();
    refreshSubmissionData();
}



/**
 * @method displayVoteForm
 * @description Show voting page if no votes have been made, otherwise thankyou page
 *
 * @param {Object} recordedClick - Object which holds voting click data
 * @return {void}
 */
function displayVoteForm(recordedClick) {

    'use strict';

    if (recordedClick.yourVote !== ZERO) {
        setPage('thankyou');
    } else {
        setPage('vote');
    }
}



/**
 * @method displayMessage
 * @description Display given message in popup
 *
 * @param {String} htmlMessage - The message to be displayed
 * @return {void}
 */
function displayMessage(htmlMessage) {

    'use strict';

    $('#message').html(htmlMessage + '<p><a href="#" id="thanks" class="button">Ok (Esc)</a></p>');
}



/**
 * @method displayNotLoggedInMessage
 * @description Display message if user is not logged in
 *
 * @return {void}
 */
function displayNotLoggedInMessage() {

    'use strict';

    displayMessage('You are not logged in! rbutr requires you to be logged in to submit rebuttals and to vote. ' +
        'Click <a target="_blank" href="' + rbutrUtils.getServerUrl(true) + '/rbutr/LoginServlet">here</a> to login or register.');
}



/**
 * @method showSubmissionPopup
 * @description Display submission page if user is logged in
 *
 * @param {String} fromTo - Type of URL that should be submitted
 * @return {void}
 */
function showSubmissionPopup(fromTo) {

    'use strict';

    if (!rbutr.getProp('loggedIn')) {
        displayNotLoggedInMessage();
    } else {
        rbutr.startSubmission(tabId, fromTo);
        displaySubmissionForm();
    }
}



/**
 * @method cancelSubmission
 * @description Stop submission and close popup
 *
 * @return {void}
 */
function cancelSubmission() {

    'use strict';

    rbutr.stopSubmission();
    window.close();
}



/**
 * @method requestRebuttals
 * @description Display rebuttal request page
 *
 * @return {void}
 */
function requestRebuttals() {

    'use strict';

    if (!rbutr.getProp('loggedIn')) {
        displayNotLoggedInMessage();
    } else {
        appendPage('request');
        setupTagTypeahead();
        $('#requestUrl').val(rbutr.getProp('canonicalUrls', tabId));
        rbutrUtils.log('debug', 'input = ', $('#requestUrl').val());
        rbutrUtils.log('debug', 'bg = ', rbutr.getProp('canonicalUrls', tabId));
        $('#StartSubmissionDiv').hide();
    }
}



/**
 * @method submitRequestData
 * @description Submit rebuttal request data to server
 *
 * @return {Boolean} Returns false if preconditions are not correct
 */
function submitRequestData() {

    'use strict';

    if (rbutr.getPropLen('tags') > MAX_TAG_COUNT) {
        document.forms['requestData'].submitLink.value = 'Maximum of 6 tags, please fix before submitting.';
        document.forms['requestData'].submitLink.disabled = false;
        return false;
    }
    $.post(rbutrUtils.getServerUrl(), {
        subscribeToPage: rbutr.getProp('canonicalUrls', tabId),
        title: rbutr.getProp('pageTitle', rbutr.getProp('canonicalUrls', tabId)),
        tags: rbutr.getProp('tags'),
        pageIsCanonical: rbutr.getProp('urlIsCanonical', rbutr.getProp('canonicalUrls', tabId)),
        cid: rbutr.getCid()
    }, function (data) {
        rbutrUtils.log('debug', 'Success : ', data);
        $('#message').html(data);
    }).fail(function (msg, arg2, arg3) {
        rbutrUtils.log('debug', 'fail : ', msg);
        rbutrUtils.log('debug', 'fail status ', msg.status);
        rbutrUtils.log('debug', 'msg = ', msg);
        rbutrUtils.log('debug', 'arg2 = ', arg2);
        rbutrUtils.log('debug', 'arg3 = ', arg3);
        displayMessage('An error occurred : ' + msg.responseText);
    });
}



/**
 * @method toTagged
 * @description Add canonical url to stored toUrl list and reresh data
 *
 * @return {void}
 */
function toTagged() {

    'use strict';

    if (rbutr.getProp('canonicalUrls', tabId) === undefined || rbutr.alreadyExists(rbutr.getProp('canonicalUrls', tabId))) {
        return;
    } else {
        rbutr.setProp('toUrls', rbutr.getPropLen('toUrls'), rbutr.getProp('canonicalUrls', tabId));
        refreshSubmissionData();
    }
}



/**
 * @method fromTagged
 * @description Add canonical url to stored fromUrl list and reresh data
 *
 * @return {void}
 */
function fromTagged() {

    'use strict';

    if (rbutr.getProp('canonicalUrls', tabId) === undefined || rbutr.alreadyExists(rbutr.getProp('canonicalUrls', tabId))) {
        return;
    } else {
        rbutr.setProp('fromUrls', rbutr.getPropLen('fromUrls'), rbutr.getProp('canonicalUrls', tabId));
        refreshSubmissionData();
    }
}



/**
 * @method cancelRequestSubmission
 * @description Return from request to submission page
 *
 * @return {void}
 */
function cancelRequestSubmission() {

    'use strict';

    $('#StartSubmissionDiv').show();
    setPage('rebuttals');
}



/**
 * @method submitData
 * @description Submit data
 *
 * @return {Boolean} Returns false if preconditions are not correct
 */
function submitData() {

    'use strict';

    if (rbutr.getPropLen('tags') > MAX_TAG_COUNT) {
        rbutr.setProp('submitError', null, 'Maximum of 6 tags, please fix before submitting.');
        return false;
    }
    if (rbutr.getPropLen('tags') === ZERO) {
        rbutr.setProp('submitError', null, 'Please enter at least one tag for this rebuttal.');
        return false;
    }
    browser.tabs.get(tabId, function (tab) {
        rbutr.submitRebuttals(tab);
    });
}



/**
 * @method handleDelayOnLoadOfRebuttals
 * @description Recursively sleep until the rebuttal data is ready
 *
 * @return {void}
 */
function handleDelayOnLoadOfRebuttals() {

    'use strict';

    const DELAY = 50;
    const TIMEOUT = 100;

    setTimeout(function () {
        // not yet ready.
        if (rbutr.getProp('rebuttals', tabId) === null) {
            waitCount++;
            if (waitCount < DELAY) {
                // Recurse
                handleDelayOnLoadOfRebuttals();
                return;
            }
            if (!rbutr.getProp('canonicalUrls', tabId)) {
                $('#message').html('This doesn\'t look like a real web page.');
                return;
            }
            $('#message').html('Server connection timed out, try again.');
        } else {
            setPage('rebuttals');
        }
    }, TIMEOUT);
}



/**
 * @method loadData
 * @description Load recorded click data
 *
 * @return {void}
 */
function loadData() {

    'use strict';

    // Loads the data from the background tab, which has likely already retrieved it.
    let recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tabId));
    if (rbutr.getProp('submittingRebuttal') === true) {
        displaySubmissionForm();

        // This means we are on a rebuttal we clicked through to.
    } else if (recordedClick && recordedClick !== null) {
        $('.votingFromUrl').attr('href', recordedClick.linkFromUrl);
        $('#currentScore').html(recordedClick.score);
        displayVoteForm(recordedClick);
    }

    // Don't show current rebuttals if adding, too messy.
    if (!rbutr.getProp('submittingRebuttal')) {
        // Needs to be set for following call which is recursive
        waitCount = ZERO;
        handleDelayOnLoadOfRebuttals();
    }
}



/**
 * @method vote
 * @description Update vote score with given value
 *
 * @param {Number} voteScore - Integer representing the score of a URL
 * @return {void}
 */
function vote(voteScore) {

    'use strict';

    let recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tabId));
    $.get(rbutrUtils.getServerUrl(), {
        'linkId': recordedClick.linkId,
        'vote': voteScore,
        'cid': rbutr.getCid()
    }, function (data) {
        $('#currentScore').html(data);
    });
    recordedClick.score += voteScore;
    recordedClick.yourVote = voteScore;
    setPage('thankyou');
}



/**
 * @method voteUp
 * @description Increment vote score
 *
 * @return {void}
 */
function voteUp() {

    'use strict';

    vote(ONE);
}



/**
 * @method voteDown
 * @description Decrement vote score
 *
 * @return {void}
 */
function voteDown() {

    'use strict';

    vote(-ONE);
}



/**
 * @method submitIdeaData
 * @description Submit rebuttal idea to the server
 *
 * @return {void}
 */
function submitIdeaData() {

    'use strict';

    document.forms['ideaForm'].submitLink.value = 'Please wait..';
    document.forms['ideaForm'].submitLink.disabled = true;
    $.post(rbutrUtils.getServerUrl(), {
        url: rbutr.getProp('canonicalUrls', tabId),
        title: rbutr.getProp('pageTitle', rbutr.getProp('canonicalUrls', tabId)),
        idea: document.forms['ideaForm'].idea.value,
        cid: rbutr.getCid()
    }).success(function (data) {
        $('#message').html(data);
    }).error(function (msg) {
        $('#message').html(msg.responseText);
    });
}



/**
 * @method loadMenu
 * @description Load menu from server and show message afterwards
 *
 * @return {void}
 */
function loadMenu() {

    'use strict';

    $('#message').html('Loading..');
    $.post(rbutrUtils.getServerUrl(), {
        getMenu: true,
        version: browser.runtime.getManifest().version,
        cid: rbutr.getCid()
    }).success(function (data) {
        $('#message').html(data);
    }).error(function (msg) {
        $('#message').html(msg.responseText);
    });
}



/**
 * @description Set up event listeners
 */
// As per http://developer.browser.com/extensions/contentSecurityPolicy.html
$(document)
    .on('click', '#tagTo', toTagged)
    .on('click', '#tagFrom', fromTagged)
    .on('click', '#startToSubmission', function () {

        'use strict';
        showSubmissionPopup('to');
    })
    .on('click', '#startFromSubmission', function () {

        'use strict';
        showSubmissionPopup('from');
    })
    .on('click', '#clickable-down', voteDown)
    .on('click', '#clickable-up', voteUp)
    .on('click', '.UserOptionsButton', loadMenu)
    .on('submit', '#ideaForm', submitIdeaData)
    .on('click', '#cancelSubmission', cancelSubmission)
    .on('submit', '#data', submitData)
    .on('submit', '#requestData', submitRequestData)
    .on('click', '#cancelSubmissionLink', cancelSubmission)
    .on('click', '#cancelRequestLink', cancelRequestSubmission)
    .on('change', '#direct', function () {

        'use strict';
        rbutr.setProp('direct', null, this.checked);
    })
    .on('click', '#requestRebuttals', requestRebuttals)  // Hook up the clickable stuff that might come back.
    .on('click', '#directShowLink', function () {

        'use strict';
        $('#hiddenDirects').show();
        $('#directShower').hide();
        return false;
    })
    .on('click', '#generalShowLink', function () {

        'use strict';
        $('#hiddenGenerals').show();
        $('#generalShower').hide();
        return false;
    })
    .on('click', '#directHideLink', function () {

        'use strict';
        $('#hiddenDirects').hide();
        $('#directShower').show();
        return false;
    })
    .on('click', '#generalHideLink', function () {

        'use strict';
        $('#hiddenGenerals').hide();
        $('#generalShower').show();
        return false;
    })
    .on('click', '#captureSourceButton', fromTagged)
    .on('click', '#thanks', function () {

        'use strict';
        window.close();
    });



/**
 * @description Set canonical url in background
 */
/** @namespace rbutr.fromUrls */
/** @namespace rbutr.toUrls */
browser.tabs.query({currentWindow: true, active: true}, function (tab) {

    'use strict';

    // This happens AFTER document.ready, so I'll do everything here, which means I get access to the URL
    tabId = tab[FIRST_ARRAY_ELEMENT].id;

    if (!rbutr.getProp('canonicalUrls', tabId)) {
        browser.runtime.sendMessage({action: 'setCanonical', tab: tab[FIRST_ARRAY_ELEMENT]});
    }

    loadData();
});
