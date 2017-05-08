/*global browser,$,MutationObserver*/
/*jslint browser:true,esnext:true */


var waitCount;
var tabId;

window.browser = (function () {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();


var rbutr = browser.extension.getBackgroundPage().rbutr;
rbutr.logDev('debug', 'in popup');



function setPage(page) {

    'use strict';
    rbutr.logDev('debug', 'show page: ', page);

    // clear all message
    document.querySelector('#message').innerHTML = '';

    if (page === 'rebuttals') {
        $('#message').html(rbutr.rebuttals[tabId]);
    } else {
        document.querySelectorAll('#popupContent > div').forEach( x => x.setAttribute('class','hide'));
        document.querySelector('#view-' + page).removeAttribute('class', 'hide');
    }
}



function appendPage(page) {

    'use strict';
    document.querySelector('#popupContent > ' + '#view-' + page).removeAttribute('class', 'hide');
}



function setupCss() {

    'use strict';

    $('.clickableImages').hover(function () {
        $(this).addClass('hover');
    }, function () {
        $(this).removeClass('hover');
    });
}



function doingTutorial() {

    'use strict';

    return rbutr.fromUrls.length > 0 && rbutr.fromUrls[0].endsWith('/fauxNews.html');
}



function refreshSubmissionData() {

    'use strict';

    if (rbutr.fromUrls.length > 1) {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut these sources</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    } else {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut this source</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    }
    // This data lives in the background so it can be shared between tabs (popups are one per tab)

    for (var i = 0; i < rbutr.fromUrls.length; i++) {
        var url = rbutr.fromUrls[i];
        var source = $('<div class="linkBlock" id="source_' + i +
            '"><span class="linkTitle">' + rbutr.getPageTitle(url) + '</span><br>' +
            '<span class="linkUrl">' + url + '</span></div>').appendTo('#submitSources');
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="s_x_' + i + '"/>').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            rbutr.fromUrls.splice(this.id.substring(4, 5), 1);
            refreshSubmissionData();
        }).appendTo(source);
    }

    if (rbutr.fromUrls.length > 0) {
        $('#submitSources').append('<div id="captureSourceButton" class="fakeLink">+ add another source</div>');
    } else {
        $('#submitSources').append('<div id="captureSourceButton" class="button">Click to capture current page as source link.</div>');
    }

    if (rbutr.toUrls.length > 1) {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With these pages</h3><div style="clear:both"></div>');
    } else {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With this page</h3><div style="clear:both"></div>');
    }

    for (var j = 0; j < rbutr.toUrls.length; j++) {
        var toUrl = rbutr.toUrls[j];
        var rebuttal = $(
            '<div class="linkBlock" id="rebuttal_' + j +
            '"><span class="linkTitle">' + rbutr.getPageTitle(toUrl) + '</span><br>' +
            '<span class="linkUrl">' + toUrl + '</span><br>' +
            '</div>').appendTo('#submitRebuttals');
        $('<input id="c_x_' + j +
            '" size="60" type="text" placeholder="Optional : Describe the relationship between these two pages in a few words" ' +
            'name="c_x_' + j + '">')
            .val(rbutr.comment[j])
            .on('keyup', function (event) {
                rbutr.comment[event.target.id.substring(4, 5)] = this.value;
            })
            .appendTo(rebuttal);
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="r_x_' + j + '">').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            rbutr.toUrls.splice(this.id.substring(4, 5), 1);
            refreshSubmissionData();
        }).appendTo(rebuttal);
    }

    if (rbutr.toUrls.length >= 3) {
        $('#captureRebuttalButton').disable();
    } else if (rbutr.toUrls.length > 0) {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="fakeLink">+ add another rebuttal</div>');
    } else {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="button">Click to capture current page as rebuttal link.</div>');
    }

    $('#captureRebuttalButton').click(function () {
        toTagged();
    });

    $('#submitError').text(rbutr.submitError);

    if (rbutr.fromUrls.length > 0 && rbutr.fromUrls[0].substring(0, 4).toLowerCase() == 'http' &&
        rbutr.toUrls.length > 0 && rbutr.toUrls[0].substring(0, 4).toLowerCase() == 'http' &&
        rbutr.tags.length > 0) {
        document.forms['data'].submitLink.title = 'Submit this rebuttal';
        document.forms['data'].submitLink.disabled = false;
    } else {
        document.forms['data'].submitLink.title = 'You must have at least one source link, rebuttal link and tag to submit';
        document.forms['data'].submitLink.disabled = true;
    }
}



function refreshTags() {

    'use strict';

    $('#tagHolder').html(''); // Wipe and recreate
    for (var i = 0; i < rbutr.tags.length; i++) {
        $('#tagHolder').append('<a class="tagForSubmission" href="#">' + rbutr.tags[i] + '</a>');
    }
    $('.tagForSubmission').click(function () {
        rbutr.removeTag(this.text);
        refreshTags();
        $('#tagTypeahead').val(''); // Somehow this gets reset on removing the actual tags?
        refreshSubmissionData();
    });
}



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



function setupTagTypeahead() {

    'use strict';

    $('#tagTypeahead').typeahead({
        name: 'tags',
        limit: 10,
        prefetch: rbutr.serverUrl + '/rbutr/PluginServlet?getPlainTagsJson=true'
        // local: rbutr.getTagsData()
    }).on('typeahead:selected', function (event, data) {
        recordTag(data.value);
        document.getElementById('#tagTypeahead').value = '';
    }).keydown(function (event) {
        var key = event.which;
        rbutr.logDev('debug', 'key = ', key);
        rbutr.logDev('debug', 'event = ', event);
        if (key == 13 || key == 186 || key == 188) {
            event.preventDefault();
            recordTag($('#tagTypeahead').val());
            $('#tagTypeahead').val('');
        }
    });
}



function displaySubmissionForm() {

    'use strict';

    setPage('submission');
    refreshTags();
    if (doingTutorial()) { // The tutorial.  Note the tag RbutrTutorial is special, don't change the text.
        recordTag('RbutrTutorial');
    } else {
        setupTagTypeahead();
    }
    $('#StartSubmissionDiv').hide();
    refreshSubmissionData();
}



function displayVoteForm(recordedClick) {

    'use strict';

    if (recordedClick.yourVote !== 0) {
        setPage('thankyou');
    } else {
        setPage('vote');
    }
}



function displayMessage(htmlMessage) {

    'use strict';

    $('#message').html(htmlMessage + '<p><a href="#" id="thanks" class="button">Ok (Esc)</a></p>');
}



function displayNotLoggedInMessage() {

    'use strict';

    displayMessage('You are not logged in! rbutr requires you to be logged in to submit rebuttals and to vote. ' +
        'Click <a target="_blank" href="' + rbutr.serverUrl + '/rbutr/LoginServlet">here</a> to login or register.');
}



function showSubmissionPopup(fromTo) {

    'use strict';

    if (!rbutr.loggedIn) {
        displayNotLoggedInMessage();
    } else {
        rbutr.startSubmission(tabId, fromTo);
        displaySubmissionForm();
    }
}



function cancelSubmission() {

    'use strict';

    rbutr.stopSubmission();
    window.close();
}



function requestRebuttals() {

    'use strict';

    if (!rbutr.loggedIn) {
        displayNotLoggedInMessage();
    } else {
        appendPage('request');
        setupTagTypeahead();
        $('#requestUrl').val(rbutr.canonical_urls[tabId]);
        rbutr.logDev('debug', 'input = ', $('#requestUrl').val());
        rbutr.logDev('debug', 'bg = ', rbutr.canonical_urls[tabId]);
        $('#StartSubmissionDiv').hide();
    }
}



function submitRequestData() {

    'use strict';

    if (rbutr.tags.length > 6) {
        document.forms['requestData'].submitLink.value = 'Maximum of 6 tags, please fix before submitting.';
        document.forms['requestData'].submitLink.disabled = false;
        return false;
    }
    $.post(rbutr.serverUrl + '/rbutr/PluginServlet', {
        subscribeToPage: rbutr.canonical_urls[tabId],
        title: rbutr.page_title[rbutr.canonical_urls[tabId]],
        tags: rbutr.tags,
        pageIsCanonical: rbutr.url_is_canonical[rbutr.canonical_urls[tabId]],
        cid: rbutr.cid
    }, function (data) {
        rbutr.logDev('debug', 'Success : ', data);
        $('#message').html(data);
    }).fail(function (msg, arg2, arg3) {
        rbutr.logDev('debug', 'fail : ', msg);
        rbutr.logDev('debug', 'fail status ', msg.status);
        rbutr.logDev('debug', 'msg = ', msg);
        rbutr.logDev('debug', 'arg2 = ', arg2);
        rbutr.logDev('debug', 'arg3 = ', arg3);
        displayMessage('An error occurred : ' + msg.responseText);
    });
}



function toTagged() {

    'use strict';

    if (rbutr.canonical_urls[tabId] === undefined || rbutr.alreadyExists(rbutr.canonical_urls[tabId])) {
        return;
    } else {
        rbutr.toUrls[rbutr.toUrls.length] = rbutr.canonical_urls[tabId];
        refreshSubmissionData();
    }
}



function fromTagged() {

    'use strict';

    if (rbutr.canonical_urls[tabId] === undefined || rbutr.alreadyExists(rbutr.canonical_urls[tabId])) {
        return;
    } else {
        if (doingTutorial()) {
            rbutr.tags = []; // Clear the tags, tutorial only has one and it needs locking down.
        }
        rbutr.fromUrls[rbutr.fromUrls.length] = rbutr.canonical_urls[tabId];
        refreshSubmissionData();
    }
}



function cancelRequestSubmission() {

    'use strict';

    $('#StartSubmissionDiv').show();
    setPage('rebuttals');
}



function submitData() {

    'use strict';

    if (rbutr.tags.length > 6) {
        rbutr.submitError = 'Maximum of 6 tags, please fix before submitting.';
        return false;
    }
    if (rbutr.tags.length === 0) {
        rbutr.submitError = 'Please enter at least one tag for this rebuttal.';
        return false;
    }
    browser.tabs.get(tabId, function (tab) {
        rbutr.submitRebuttals(tab);
    });
}



function handleDelayOnLoadOfRebuttals() {

    'use strict';

    // Recursively sleep until the rebuttal data is ready.
    setTimeout(function () {
        // not yet ready.
        if (rbutr.rebuttals[tabId] === null) {
            waitCount++;
            if (waitCount < 50) {
                // Recurse
                handleDelayOnLoadOfRebuttals();
                return;
            }
            if (!rbutr.canonical_urls[tabId]) {
                $('#message').html('This doesn\'t look like a real web page.');
                return;
            }
            $('#message').html('Server connection timed out, try again.');
        } else {
            setPage('rebuttals');
        }
    }, 100);
}



function loadData() {

    'use strict';

    // Loads the data from the background tab, which has likely already retrieved it.
    var recordedClick = rbutr.getRecordedClickByToUrl(rbutr.canonical_urls[tabId]);
    if (rbutr.submittingRebuttal) {
        displaySubmissionForm();

        // This means we are on a rebuttal we clicked through to.
    } else if (recordedClick && recordedClick !== null) {
        $('.votingFromUrl').attr('href', recordedClick.linkFromUrl);
        $('#currentScore').html(recordedClick.score);
        displayVoteForm(recordedClick);
    }

    // Don't show current rebuttals if adding, too messy.
    if (!rbutr.submittingRebuttal) {
        // Needs to be set for following call which is recursive
        waitCount = 0;
        handleDelayOnLoadOfRebuttals();
    }
}



function vote(voteScore) {

    'use strict';

    var recordedClick = rbutr.getRecordedClickByToUrl(rbutr.canonical_urls[tabId]);
    $.get(rbutr.serverUrl + '/rbutr/PluginServlet', {
        'linkId': recordedClick.linkId,
        'vote': voteScore,
        'cid': rbutr.cid
    }, function (data) {
        $('#currentScore').html(data);
    });
    recordedClick.score += voteScore;
    recordedClick.yourVote = voteScore;
    setPage('thankyou');
}



function voteUp() {

    'use strict';

    vote(1);
}



function voteDown() {

    'use strict';

    vote(-1);
}



function submitIdeaData() {

    'use strict';

    document.forms['ideaForm'].submitLink.value = 'Please wait..';
    document.forms['ideaForm'].submitLink.disabled = true;
    $.post(rbutr.serverUrl + '/rbutr/PluginServlet', {
        url: rbutr.canonical_urls[tabId],
        title: rbutr.page_title[rbutr.canonical_urls[tabId]],
        idea: document.forms['ideaForm'].idea.value,
        cid: rbutr.cid
    }).success(function (data) {
        $('#message').html(data);
    }).error(function (msg) {
        $('#message').html(msg.responseText);
    });
}



function loadMenu() {

    'use strict';

    $('#message').html('Loading..');
    $.post(rbutr.serverUrl + '/rbutr/PluginServlet', {
        getMenu: true,
        version: browser.runtime.getManifest().version,
        cid: rbutr.cid
    }).success(function (data) {
        $('#message').html(data);
    }).error(function (msg) {
        $('#message').html(msg.responseText);
    });
}



// As per http://developer.browser.com/extensions/contentSecurityPolicy.html
// Set up the listeners here instead of in the HTML
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
        rbutr.direct = this.checked;
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



/** @namespace rbutr.fromUrls */
/** @namespace rbutr.toUrls */
browser.tabs.query({currentWindow: true, active: true}, function (tab) {

    'use strict';

    // This happens AFTER document.ready, so I'll do everything here, which means I get access to the URL
    tabId = tab[0].id;

    if (!rbutr.canonical_urls[tabId]) {
        browser.runtime.sendMessage({action: 'setCanonical', tab: tab[0]});
    }
    setupCss();
    // This sets up everything.
    loadData();
});



// Add endsWith function to String, as per http://stackoverflow.com/questions/280634/endswith-in-javascript
String.prototype.endsWith = function (suffix) {

    'use strict';

    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
