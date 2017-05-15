/*global console,JSON,*/
/*jslint browser:true,esnext:true */



/**
 * @description Class constructor with variable initialisation
 *
 * @method RbutrUtils
 * @param {void}
 * @return {object}
 */
function RbutrUtils() {

    'use strict';

    return this;
}



RbutrUtils.prototype = {

    constructor: RbutrUtils,


    /**
     * @description If developer mode is enabled, the passed parameters will be logged to the console. First parameter defines the log-level
     *
     * @method log
     * @param {mixed}
     * @return {void}
     */
    log: function () {

        'use strict';

        if(this.isDev()) {
            // only continue if there are more than 1 params (0 = level, 1-x = output)
            if(arguments.length > 1) {
                var logLevel = console[arguments[0]],
                    logArguments = [];

                for (var i = 1; i < arguments.length; i++) {
                    logArguments.push(arguments[i]);
                }

                if(typeof logLevel === 'function') {
                    logLevel.apply(null, ['[rbutr] '].concat(logArguments));
                } else {
                    console.error('[rbutr] console.' + arguments[0] + ' is not a valid logging function.');
                    console.debug.apply(null, ['[rbutr] '].concat(logArguments));
                }
            }
        }
    },



    /**
     * @description Determine, wether development mode is enabled or not
     *
     * @method isDev
     * @param {void}
     * @return {boolean}
     */
    isDev: function () {

        'use strict';

        var dev = localStorage.getItem('rbutr.isDev');
        return dev === 'true';
    },



    /**
     * @description Get server url or just domain
     *
     * @method isDev
     * @param {boolean} domainOnly
     * @return {string}
     */
    getServerUrl: function (domainOnly) {

        'use strict';

        let
            domain = this.isDev() ? 'https://russell.rbutr.com' : 'http://rbutr.com',
            apiPath = domainOnly === true ? '' : '/rbutr/PluginServlet';

        return domain + apiPath;
    },




    /**
     * @description Cleanup a url to get the domain out of it.
     *
     * @method url2Domain
     * @param {string} url
     * @return {string}
     */
    url2Domain: function (url) {

        'use strict';

        if (url) {
            url = url.toString().replace(/^(?:https?|ftp)\:\/\//i, '');
            url = url.toString().replace(/^www\./i, '');
            url = url.toString().replace(/\/.*/, '');
            return url;
        }
    },



    /**
     * @description Convert Unicode escaped string to regular string, see http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
     *
     * @method unicode2String
     * @param {string} str
     * @return {string}
     */
    unicode2String: function (str) {
        return decodeURIComponent(JSON.parse('"' + str.replace(/\"/g, '\\"') + '"'));
    }
};
