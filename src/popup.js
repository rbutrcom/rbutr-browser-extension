/*global browser,$,MutationObserver,RbutrUtils*/
/*jslint browser:true,esnext:true */


var waitCount;
var tabId;


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
var rbutr = browser.extension.getBackgroundPage().rbutr;
rbutrUtils.log('debug', 'in popup');



/**
 * @description Toggle currently displayed popup page
 *
 * @method setPage
 * @param {string} page
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
 * @description Append page to currently displayed popup page
 *
 * @method appendPage
 * @param {string} page
 * @return {void}
 */
function appendPage(page) {

    'use strict';
    document.querySelector('#popupContent > ' + '#view-' + page).removeAttribute('class', 'hide');
}



/**
 * @description Refresh stored data certain user interactions
 *
 * @method refreshSubmissionData
 * @param {void}
 * @return {void}
 */
function refreshSubmissionData() {

    'use strict';

    if (rbutr.getPropLen('fromUrls') > 1) {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut these sources</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    } else {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut this source</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    }
    // This data lives in the background so it can be shared between tabs (popups are one per tab)

    for (var i = 0; i < rbutr.getPropLen('fromUrls'); i++) {
        var url = rbutr.getProp('fromUrls', i);
        var source = $('<div class="linkBlock" id="source_' + i +
            '"><span class="linkTitle">' + rbutr.getPageTitle(url) + '</span><br>' +
            '<span class="linkUrl">' + url + '</span></div>').appendTo('#submitSources');
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="s_x_' + i + '"/>').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            rbutr.setProp('fromUrls', this.id.substring(4, 5), null);
            refreshSubmissionData();
        }).appendTo(source);
    }

    if (rbutr.getPropLen('fromUrls') > 0) {
        $('#submitSources').append('<div id="captureSourceButton" class="fakeLink">+ add another source</div>');
    } else {
        $('#submitSources').append('<div id="captureSourceButton" class="button">Click to capture current page as source link.</div>');
    }

    if (rbutr.getPropLen('toUrls') > 1) {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With these pages</h3><div style="clear:both"></div>');
    } else {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With this page</h3><div style="clear:both"></div>');
    }

    for (var j = 0; j < rbutr.getPropLen('toUrls'); j++) {
        var toUrl = rbutr.getProp('toUrls', j);
        var rebuttal = $(
            '<div class="linkBlock" id="rebuttal_' + j +
            '"><span class="linkTitle">' + rbutr.getPageTitle(toUrl) + '</span><br>' +
            '<span class="linkUrl">' + toUrl + '</span><br>' +
            '</div>').appendTo('#submitRebuttals');
        $('<input id="c_x_' + j +
            '" size="60" type="text" placeholder="Optional : Describe the relationship between these two pages in a few words" ' +
            'name="c_x_' + j + '">')
            .val(rbutr.getProp('comment', j))
            .on('keyup', function (event) {
                rbutr.setProp('comment', event.target.id.substring(4, 5), this.value);
            })
            .appendTo(rebuttal);
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="r_x_' + j + '">').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            rbutr.setProp('toUrls', this.id.substring(4, 5), null);
            refreshSubmissionData();
        }).appendTo(rebuttal);
    }

    if (rbutr.getPropLen('toUrls') >= 3) {
        $('#captureRebuttalButton').disable();
    } else if (rbutr.getPropLen('toUrls') > 0) {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="fakeLink">+ add another rebuttal</div>');
    } else {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="button">Click to capture current page as rebuttal link.</div>');
    }

    $('#captureRebuttalButton').click(function () {
        toTagged();
    });

    $('#submitError').text(rbutr.getProp('submitError'));

    if (rbutr.getPropLen('fromUrls') > 0 && rbutr.getProp('fromUrls', 0).substring(0, 4).toLowerCase() == 'http' &&
        rbutr.getPropLen('toUrls') > 0 && rbutr.getProp('toUrls', 0).substring(0, 4).toLowerCase() == 'http' &&
        rbutr.getPropLen('tags') > 0) {
        document.forms['data'].submitLink.title = 'Submit this rebuttal';
        document.forms['data'].submitLink.disabled = false;
    } else {
        document.forms['data'].submitLink.title = 'You must have at least one source link, rebuttal link and tag to submit';
        document.forms['data'].submitLink.disabled = true;
    }
}



/**
 * @description Refresh stored tags
 *
 * @method refreshTags
 * @param {void}
 * @return {void}
 */
function refreshTags() {

    'use strict';

    $('#tagHolder').html(''); // Wipe and recreate
    for (var i = 0; i < rbutr.getPropLen('tags'); i++) {
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
 * @description Add tag to taglist and refresh stored data
 *
 * @method recordTag
 * @param {string} tagText
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
 * @description Setup typeahead autocomplete library
 *
 * @method setupTagTypeahead
 * @param {void}
 * @return {void}
 */
function setupTagTypeahead() {

    'use strict';

    $('#tagTypeahead').typeahead({
        name: 'tags',
        limit: 10,
        prefetch: rbutrUtils.getServerUrl() + '?getPlainTagsJson=true'
        // local: rbutr.getTagsData()
    }).on('typeahead:selected', function (event, data) {
        recordTag(data.value);
        document.getElementById('#tagTypeahead').value = '';
    }).keydown(function (event) {
        var key = event.which;
        rbutrUtils.log('debug', 'key = ', key);
        rbutrUtils.log('debug', 'event = ', event);
        if (key == 13 || key == 186 || key == 188) {
            event.preventDefault();
            recordTag($('#tagTypeahead').val());
            $('#tagTypeahead').val('');
        }
    });
}



/**
 * @description Prepare and display submission page
 *
 * @method displaySubmissionForm
 * @param {void}
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
 * @description Show voting page if no votes have been made, otherwise thankyou page
 *
 * @method displayVoteForm
 * @param {integer} recordedClick
 * @return {void}
 */
function displayVoteForm(recordedClick) {

    'use strict';

    if (recordedClick.yourVote !== 0) {
        setPage('thankyou');
    } else {
        setPage('vote');
    }
}



/**
 * @description Display given message in popup
 *
 * @method displayMessage
 * @param {string} htmlMessage
 * @return {void}
 */
function displayMessage(htmlMessage) {

    'use strict';

    $('#message').html(htmlMessage + '<p><a href="#" id="thanks" class="button">Ok (Esc)</a></p>');
}



/**
 * @description Display message if user is not logged in
 *
 * @method displayNotLoggedInMessage
 * @param {void}
 * @return {void}
 */
function displayNotLoggedInMessage() {

    'use strict';

    displayMessage('You are not logged in! rbutr requires you to be logged in to submit rebuttals and to vote. ' +
        'Click <a target="_blank" href="' + rbutrUtils.getServerUrl(true) + '/rbutr/LoginServlet">here</a> to login or register.');
}



/**
 * @description Display submission page if user is logged in
 *
 * @method showSubmissionPopup
 * @param {string} fromTo
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
 * @description Stop submission and close popup
 *
 * @method cancelSubmission
 * @param {void}
 * @return {void}
 */
function cancelSubmission() {

    'use strict';

    rbutr.stopSubmission();
    window.close();
}



/**
 * @description Display rebuttal request page
 *
 * @method requestRebuttals
 * @param {void}
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
 * @description Submit rebuttal request data to server
 *
 * @method submitRequestData
 * @param {void}
 * @return {boolean}
 */
function submitRequestData() {

    'use strict';

    if (rbutr.getPropLen('tags') > 6) {
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
 * @description Add canonical url to stored toUrl list and reresh data
 *
 * @method toTagged
 * @param {void}
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
 * @description Add canonical url to stored fromUrl list and reresh data
 *
 * @method fromTagged
 * @param {void}
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
 * @description Return from request to submission page
 *
 * @method cancelRequestSubmission
 * @param {void}
 * @return {void}
 */
function cancelRequestSubmission() {

    'use strict';

    $('#StartSubmissionDiv').show();
    setPage('rebuttals');
}



/**
 * @description Submit data
 *
 * @method submitData
 * @param {void}
 * @return {boolean}
 */
function submitData() {

    'use strict';

    if (rbutr.getPropLen('tags') > 6) {
        rbutr.setProp('submitError', null, 'Maximum of 6 tags, please fix before submitting.');
        return false;
    }
    if (rbutr.getPropLen('tags') === 0) {
        rbutr.setProp('submitError', null, 'Please enter at least one tag for this rebuttal.');
        return false;
    }
    browser.tabs.get(tabId, function (tab) {
        rbutr.submitRebuttals(tab);
    });
}



/**
 * @description Recursively sleep until the rebuttal data is ready
 *
 * @method handleDelayOnLoadOfRebuttals
 * @param {void}
 * @return {void}
 */
function handleDelayOnLoadOfRebuttals() {

    'use strict';

    setTimeout(function () {
        // not yet ready.
        if (rbutr.getProp('rebuttals', tabId) === null) {
            waitCount++;
            if (waitCount < 50) {
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
    }, 100);
}



/**
 * @description Load recorded click data
 *
 * @method loadData
 * @param {void}
 * @return {void}
 */
function loadData() {

    'use strict';

    // Loads the data from the background tab, which has likely already retrieved it.
    var recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tabId));
    if (rbutr.getProp('submittingRebuttal')) {
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
        waitCount = 0;
        handleDelayOnLoadOfRebuttals();
    }
}



/**
 * @description Update vote score with given value
 *
 * @method vote
 * @param {integer} voteScore
 * @return {void}
 */
function vote(voteScore) {

    'use strict';

    var recordedClick = rbutr.getRecordedClickByToUrl(rbutr.getProp('canonicalUrls', tabId));
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
 * @description Increment vote score
 *
 * @method voteUp
 * @param {void}
 * @return {void}
 */
function voteUp() {

    'use strict';

    vote(1);
}



/**
 * @description Decrement vote score
 *
 * @method voteDown
 * @param {void}
 * @return {void}
 */
function voteDown() {

    'use strict';

    vote(-1);
}



/**
 * @description Submit rebuttal idea to the server
 *
 * @method submitIdeaData
 * @param {void}
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
 * @description Load menu from server and show message afterwards
 *
 * @method loadMenu
 * @param {void}
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
    tabId = tab[0].id;

    if (!rbutr.getProp('canonicalUrls', tabId)) {
        browser.runtime.sendMessage({action: 'setCanonical', tab: tab[0]});
    }

    loadData();
});
