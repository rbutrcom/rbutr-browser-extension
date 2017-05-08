/*global browser,console,$,JSON*/
/*jslint browser:true,esnext:true */

window.browser = (function () {

    'use strict';

    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();



function shouldShowMessage(url) {

    'use strict';

    var result = !localStorage.getItem('rbutr.dontshow.' + url);
    if (result === undefined || result === null) {
        result = true;
    }
    return result;
}



var isInstalledNode = document.createElement('div');
isInstalledNode.id = 'rbutr-extension-is-installed';
document.body.appendChild(isInstalledNode);



browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        'use strict';

        if (shouldShowMessage(request.url)) {
            $('body').append('<div id="rbutrfloatdiv" style="position:fixed; width:250px; height: 250px;top:10px;right:10px; ' +
                'padding:16px;background:#FFFFFF;   border:2px solid #2266AA;   z-index:2147483647">' +
                '<center><img src="http://rbutr.com/images/logo_small_transparent.png">' +
                '<br><span style="text-align: center;font-size:9pt; color:black;font-weight:bold;">' + request.message +
                '<br><br><span style="font-weight:normal;font-size:x-small">This message will fade in 5 secs.</span>' +
                '<div><label style="margin-top:10px;width:100%;font-weight:normal;font-size:x-small;text-align: center">' +
                '<input id="dontShowAgain" type="checkbox">&nbsp;Dont tell me again for this page</label></div>' +
                '</center></span></center>' +
                '</div>'
            );

            window.setTimeout(function () {
                $('#rbutrfloatdiv').remove();
            }, 5000);

            $('#dontShowAgain').css('cursor', 'pointer').click(function () {
                localStorage.setItem('rbutr.dontshow.' + request.url, $('#dontShowAgain')[0].checked);
            });
        }
    }
);



var canonicalValue = $('head link[rel=canonical]').attr('href');
var title = $('title').text();



// When the user clicks through from our webpage, rather than the plugin, we hide the click details in the re-direct page.
if ($('#clickDataForRbutrPlugin').length) { // jQuery never returns null.. http://stackoverflow.com/questions/477667/how-to-check-null-objects-in-jquery
    var click = JSON.parse($('#clickDataForRbutrPlugin').text());
    browser.runtime.sendMessage({'action': 'setClick', 'click': click});
}


browser.runtime.sendMessage({'action': 'setCanonical', 'url': canonicalValue || location.href, 'title': title});


$('body').append('<div style="display: none;" class="rbutrInstalled"></div>');
