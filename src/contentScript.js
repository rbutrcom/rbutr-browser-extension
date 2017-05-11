/*global browser,console,$,JSON*/
/*jslint browser:true,esnext:true */


/**
 * @description Multi-Browser support
 */
window.browser = (function () {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();



var canonicalValue = $('head link[rel=canonical]').attr('href');
var title = $('title').text();



/**
 * @description Determine, wether rbutr message box should appear or not
 *
 * @method shouldShowMessage
 * @param {string} url
 * @return {boolean}
 */
function shouldShowMessage(url) {

    'use strict';

    var result = !localStorage.getItem('rbutr.dontshow.' + url);
    return result === undefined || result === null;
}



/**
 * @description Handle message box
 */
browser.runtime.onMessage.addListener(
    function (request) {

        'use strict';

        if (shouldShowMessage(request.url)) {
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
);



// When the user clicks through from our webpage, rather than the plugin, we hide the click details in the re-direct page.
if ($('#clickDataForRbutrPlugin').length) { // jQuery never returns null.. http://stackoverflow.com/questions/477667/how-to-check-null-objects-in-jquery
    var click = JSON.parse($('#clickDataForRbutrPlugin').text());
    browser.runtime.sendMessage({'action': 'setClick', 'click': click});
}


browser.runtime.sendMessage({'action': 'setCanonical', 'url': canonicalValue || location.href, 'title': title});
