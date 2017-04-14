/*global chrome,console,$,MutationObserver*/
/*jslint browser: true */

var waitCount;
var tabId;
var bg;

var start = new Date().getTime();



window.browser = (function () {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();



function log(text) {

    'use strict';

    var offset = new Date().getTime() - start;
    console.log('[RBUTR] ' + text);
    browser.runtime.sendMessage({'action': 'log', 'text': String(offset) + ' ' + text});
}



function error(text) {
    'use strict';
    browser.runtime.sendMessage({'action': 'error', 'text': text});
}



function setPage(page) {

    'use strict';
    console.log('[RBUTR] show page: ' + page);

    if (page === 'rebuttals') {
        $('#message').html(bg.rebuttals[tabId]);
    } else {
        document.querySelectorAll('#popupContent > div').forEach( x=> x.setAttribute('class','hide'));
        document.querySelector('#view-'  + page).removeAttribute('class', 'hide');
    }
}



function appendPage(page) {

    'use strict';
    document.querySelector('#popupContent > ' + '.view-'  + page).removeAttribute('class', 'hide');
}



function setupCss() {

    'use strict';

    $('.clickableImages').hover(function () {
        $(this).addClass('hover');
    }, function () {
        $(this).removeClass('hover');
    });
}



/*
 //NOT USED
 function loadRebuttal(url) {
    browser.tabs.create({'url':url, 'selected':true});
 }
 */



function doingTutorial() {

    'use strict';

    return bg.fromUrls[0] != null && bg.fromUrls[0].endsWith('/fauxNews.html');
}



function refreshSubmissionData() {

    'use strict';

    if (bg.fromUrls.length > 1) {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut these sources</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    } else {
        $('#submitSources').html('<h3 class="sourceHeading">Rebut this source</h3><div class="UserOptionsButton StartRebutal3">Menu</div><div style="clear:both"></div>');
    }
    // This data lives in the background so it can be shared between tabs (popups are one per tab)

    for (var i = 0; i < bg.fromUrls.length; i++) {
        var url = bg.fromUrls[i];
        var source = $('<div class="linkBlock" id="source_' + i +
            '"><span class="linkTitle">' + bg.getPageTitle(url) + '</span><br>' +
            '<span class="linkUrl">' + url + '</span></div>').appendTo('#submitSources');
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="s_x_' + i + '"/>').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            bg.fromUrls.splice(this.id.substring(4, 5), 1);
            refreshSubmissionData();
        }).appendTo(source);
    }

    if (bg.fromUrls.length > 0) {
        $('#submitSources').append('<div id="captureSourceButton" class="fakeLink">+ add another source</div>');
    } else {
        $('#submitSources').append('<div id="captureSourceButton" class="button">Click to capture current page as source link.</div>');
    }

    if (bg.toUrls.length > 1) {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With these pages</h3><div style="clear:both"></div>');
    } else {
        $('#submitRebuttals').html('<h3 class="rebuttalHeading">With this page</h3><div style="clear:both"></div>');
    }

    for (i = 0; i < bg.toUrls.length; i++) {
        var toUrl = bg.toUrls[i];
        var rebuttal = $(
            '<div class="linkBlock" id="rebuttal_' + i +
            '"><span class="linkTitle">' + bg.getPageTitle(toUrl) + '</span><br>' +
            '<span class="linkUrl">' + toUrl + '</span><br>' +
            '</div>').appendTo('#submitRebuttals');
        $('<input id="c_x_' + i +
            '" size="60" type="text" placeholder="Optional : Describe the relationship between these two pages in a few words" ' +
            'name="c_x_' + i + '">')
            .val(bg.comment[i])
            .on('keyup', function (event) {
                bg.comment[event.target.id.substring(4, 5)] = this.value;
            })
            .appendTo(rebuttal);
        $('<img class="close" src="http://rbutr.com/images/button-removetag.png" id="r_x_' + i + '">').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            bg.toUrls.splice(this.id.substring(4, 5), 1);
            refreshSubmissionData();
        }).appendTo(rebuttal);
    }

    if (bg.toUrls.length >= 3) {
        $('#captureRebuttalButton').disable();
    } else if (bg.toUrls.length > 0) {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="fakeLink">+ add another rebuttal</div>');
    } else {
        $('#submitRebuttals').append('<div id="captureRebuttalButton" class="button">Click to capture current page as rebuttal link.</div>');
    }

    $('#captureRebuttalButton').click(function () {
        toTagged();
    });
    // document.forms['data'].fromUrl.value = bg.fromUrl;
    // document.forms['data'].toUrl.value = bg.toUrl;
    // document.forms['data'].tags.value = bg.tags;
    $('#submitError').text(bg.submitError);

    if (bg.fromUrls[0] != null && bg.fromUrls[0].substring(0, 4).toLowerCase() == 'http' &&
        bg.toUrls[0] != null && bg.toUrls[0].substring(0, 4).toLowerCase() == 'http' &&
        bg.tags.length > 0) {
        // document.forms['data'].comment.disabled = false;
        // document.forms['data'].comment.focus();
        // if (bg.comment != null && bg.comment != '' &&
        //     bg.tags != null && bg.tags != '') {
        document.forms['data'].submitLink.title = 'Submit this rebuttal';
        document.forms['data'].submitLink.disabled = false;
        // } else {
        //     document.forms['data'].submitLink.value = 'Enter a comment and pick at least one tag.';
        // }
    } else {
        document.forms['data'].submitLink.title = 'You must have at least one source link, rebuttal link and tag to submit';
        document.forms['data'].submitLink.disabled = true;
    }
}



function refreshTags() {

    'use strict';

    $('#tagHolder').html(''); // Wipe and recreate
    for (var i = 0; i < bg.tags.length; i++) {
        $('#tagHolder').append('<a class="tagForSubmission" href="#">' + bg.tags[i] + '</a>');
    }
    $('.tagForSubmission').click(function () {
        bg.removeTag(this.text);
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
    bg.addTag(tagText);
    refreshTags();
    refreshSubmissionData();
}



function setupTagTypeahead() {

    'use strict';

    $('#tagTypeahead').typeahead({
        name: 'tags',
        limit: 10,
        prefetch: 'http://rbutr.com/rbutr/PluginServlet?getPlainTagsJson=true'
        // local: bg.getTagsData()
    }).on('typeahead:selected', function (event, data) {
        recordTag(data.value);
        //   console.log('data', data);
        document.getElementById('#tagTypeahead').value = '';
    }).keydown(function (event) {
        var key = event.which;
        console.log('[RBUTR] key = ' + key);
        console.log('[RBUTR] event = ', event);
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

    $('#wholePopupDiv').html(htmlMessage + '<p><a href="#" id="thanks" class="button">Ok (Esc)</a></p>');
}



function displayNotLoggedInMessage() {

    'use strict';

    displayMessage('You are not logged in! rbutr requires you to be logged in to submit rebuttals and to vote. ' +
        'Click <a target="_blank" href="http://rbutr.com/rbutr/LoginServlet">here</a> to login or register.');
}



function showSubmissionPopup(fromTo) {

    'use strict';

    if (!bg.loggedIn) {
        displayNotLoggedInMessage();
        return;
    }
    bg.startSubmission(tabId, fromTo);
    displaySubmissionForm();
}



function cancelSubmission() {

    'use strict';

    bg.stopSubmission();
    window.close();
    // $('#ssubmitDiv').hide();
    // $('#StartSubmissionDiv').show();
}



function requestRebuttals() {

    'use strict';

    if (!bg.loggedIn) {
        displayNotLoggedInMessage();
        return;
    }
    appendPage('request');
    setupTagTypeahead();
    $('#requestUrl').val(bg.canonical_urls[tabId]);
    console.log('[RBUTR] input = ' + $('#requestUrl').val());
    console.log('[RBUTR] bg = ' + bg.canonical_urls[tabId]);
    $('#StartSubmissionDiv').hide();
}



function submitRequestData() {

    'use strict';

    if (bg.tags.length > 6) {
        document.forms['requestData'].submitLink.value = 'Maximum of 6 tags, please fix before submitting.';
        document.forms['requestData'].submitLink.disabled = false;
        return false;
    }
    $.post('http://rbutr.com/rbutr/PluginServlet', {
        subscribeToPage: bg.canonical_urls[tabId],
        title: bg.page_title[bg.canonical_urls[tabId]],
        tags: bg.tags,
        pageIsCanonical: bg.url_is_canonical[bg.canonical_urls[tabId]],
        cid: bg.getCid()
    }, function (data) {
        console.log('[RBUTR] Success : ', data);
        $('#wholePopupDiv').html(data);
    }).fail(function (msg, arg2, arg3) {
        console.log('[RBUTR] fail : ', msg);
        console.log('[RBUTR] fail status ' + msg.status);
        console.log('[RBUTR] msg = ', msg);
        console.log('[RBUTR] arg2 = ', arg2);
        console.log('[RBUTR] arg3 = ', arg3);
        displayMessage('An error occurred : ' + msg.responseText);
    });
}



function toTagged() {

    'use strict';

    if (bg.canonical_urls[tabId] === undefined || bg.alreadyExists(bg.canonical_urls[tabId])) {
        return;
    }
    bg.toUrls[bg.toUrls.length] = bg.canonical_urls[tabId];
    refreshSubmissionData();
}



function fromTagged() {

    'use strict';

    if (bg.canonical_urls[tabId] === undefined || bg.alreadyExists(bg.canonical_urls[tabId])) {
        return;
    }
    if (doingTutorial()) {
        bg.tags = []; // Clear the tags, tutorial only has one and it needs locking down.
    }
    bg.fromUrls[bg.fromUrls.length] = bg.canonical_urls[tabId];
    refreshSubmissionData();
}



//function swapUrls() {
//     var tmp = bg.fromUrl;
//     bg.fromUrl = bg.toUrl;
//     bg.toUrl = tmp;
//     refreshSubmissionData();
//}



function cancelRequestSubmission() {

    'use strict';

    $('#StartSubmissionDiv').show();
    setPage('rebuttals');
}



function submitData() {

    'use strict';

    if (bg.tags.length > 6) {
        bg.submitError = 'Maximum of 6 tags, please fix before submitting.';
        return false;
    }
    if (bg.tags.length === 0) {
        bg.submitError = 'Please enter at least one tag for this rebuttal.';
        return false;
    }
    browser.tabs.get(tabId, function (tab) {
        bg.submitRebuttals(tab);
    });
}



function handleDelayOnLoadOfRebuttals() {

    'use strict';

    // Recursively sleep until the rebuttal data is ready.
    setTimeout(function () {
        // not yet ready.
        if (bg.rebuttals[tabId] == null) {
            waitCount++;
            if (waitCount < 50) {
                // Recurse
                handleDelayOnLoadOfRebuttals();
                return;
            }
            if (!bg.canonical_urls[tabId]) {
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
    var recordedClick = bg.getRecordedClickByToUrl(bg.canonical_urls[tabId]);
    // bg.console.log('recordedClick[' + tabUrl + '] = ' + recordedClick);
    if (bg.submittingRebuttal) {
        displaySubmissionForm();

        // This means we are on a rebuttal we clicked through to.
    } else if (recordedClick != null) {
        $('.votingFromUrl').attr('href', recordedClick.linkFromUrl);
        $('#currentScore').html(recordedClick.score);
        displayVoteForm(recordedClick);
    }

    // $('#voteDownDiv').html(bg.voteDownDiv);
    // $('#voteUpDiv').html(bg.voteUpDiv);

    // Don't show current rebuttals if adding, too messy.
    if (!bg.submittingRebuttal) {
        // Needs to be set for following call which is recursive
        waitCount = 0;
        handleDelayOnLoadOfRebuttals();
    }
    // if (!bg.loggedIn) {
    //     $('#StartSubmissionDiv').hide();
    // }
}



function vote(voteScore) {

    'use strict';

    var recordedClick = bg.getRecordedClickByToUrl(bg.canonical_urls[tabId]);
    $.get('http://rbutr.com/rbutr/PluginServlet', {
        'linkId': recordedClick.linkId,
        vote: voteScore,
        cid: bg.getCid()
    }, function (data) {
        $('#currentScore').html(data);
    });
    recordedClick.score += voteScore;
    recordedClick.yourVote = voteScore;
    // $('#voteDownDiv').hide();
    // $('#voteUpDiv').hide();
    setPage('thankyou');
}



function voteUp() {

    'use strict';

    vote(1);
    // $('#voteDiv img.clickableImages').hide(); // Hide the buttons
    // $('#voteUpDiv').show();
}



function voteDown() {

    'use strict';

    vote(-1);
    // $('#voteDiv img.clickableImages').hide(); // Hide the buttons
    // $('#voteDownDiv').show();
}



/*
 //NOT USED
 function submitIdea() {
    document.forms['ideaForm'].url.value = bg.canonical_urls[tabId];
    setPage('idea');
 }
 */



function submitIdeaData() {

    'use strict';

    document.forms['ideaForm'].submitLink.value = 'Please wait..';
    document.forms['ideaForm'].submitLink.disabled = true;
    $.post('http://rbutr.com/rbutr/PluginServlet', {
        url: bg.canonical_urls[tabId],
        title: bg.page_title[bg.canonical_urls[tabId]],
        idea: document.forms['ideaForm'].idea.value,
        cid: bg.getCid()
    }).success(function (data) {
        $('#wholePopupDiv').html(data);
    }).error(function (msg) {
        $('#wholePopupDiv').html(msg.responseText);
    });
}



function loadMenu() {

    'use strict';

    $('#wholePopupDiv').html('Loading..');
    $.post('http://rbutr.com/rbutr/PluginServlet', {
        getMenu: true,
        version: browser.runtime.getManifest().version,
        cid: bg.getCid()
    }).success(function (data) {
        $('#wholePopupDiv').html(data);
    }).error(function (msg) {
        $('#wholePopupDiv').html(msg.responseText);
    });
}



/*
 //NOT USED
 function recordLinkClick(linkId, fromLinkUrl, toLinkUrl, score, yourVote) {
 bg.recordLinkClick(tabId, linkId, fromLinkUrl, toLinkUrl, score, yourVote);
 }
 */



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
        bg.direct = this.checked;
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
    .on('click', '.UserOptionsButton', loadMenu)
    .on('click', '#captureSourceButton', fromTagged)
    .on('click', '#thanks', function () {

        'use strict';
        window.close();
    });



/** @namespace bg.fromUrls */
/** @namespace bg.toUrls */
browser.tabs.query({currentWindow: true, active: true}, function (tab) {

    'use strict';

    // This happens AFTER document.ready, so I'll do everything here, which means I get access to the URL
    tabId = tab[0].id;
    bg = browser.extension.getBackgroundPage();
    if (!bg.canonical_urls[tabId]) {
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
