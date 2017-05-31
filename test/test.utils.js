/*global require,describe,it,beforeEach,afterEach*/
/*jslint esnext:true */

var assert = require('assert');
var rewire = require('rewire');

var utils = rewire('../src/utils.js');
var RbutrUtils = utils.__get__('RbutrUtils');


describe('Utils', function() {

    describe('#RbutrUtils()', function() {
        it('should return an object', function() {
            assert.strictEqual(typeof RbutrUtils(), 'object');
        });
    });

    describe('#RbutrUtils.isDev()', function() {
        beforeEach(() => {
            localStorage.clear();
        });
        it('should return true if isDev-Key is "true"', function() {
            localStorage.setItem('rbutr.isDev', 'true');
            assert.strictEqual(RbutrUtils().isDev(), true);
        });
        it('should return false if isDev-Key is not "true" or not set', function() {
            assert.strictEqual(RbutrUtils().isDev(), false);
        });
    });

    describe('#RbutrUtils.getServerUrl()', function() {
        afterEach(() => {
            localStorage.clear();
        });
        it('should return https://russell.rbutr.com/rbutr/PluginServlet in dev mode', function() {
            localStorage.setItem('rbutr.isDev', 'true');
            assert.strictEqual(RbutrUtils().getServerUrl(), 'https://russell.rbutr.com/rbutr/PluginServlet');
        });
        it('should return http://rbutr.com/rbutr/PluginServlet in productive mode', function() {
            assert.strictEqual(RbutrUtils().getServerUrl(), 'http://rbutr.com/rbutr/PluginServlet');
        });
    });

    describe('#RbutrUtils.getServerUrl(true)', function() {
        afterEach(() => {
            localStorage.clear();
        });
        it('should return https://russell.rbutr.com in dev mode', function() {
            localStorage.setItem('rbutr.isDev', 'true');
            assert.strictEqual(RbutrUtils().getServerUrl(true), 'https://russell.rbutr.com');
        });
        it('should return http://rbutr.com in productive mode', function() {
            assert.strictEqual(RbutrUtils().getServerUrl(true), 'http://rbutr.com');
        });
    });

    describe('#RbutrUtils.url2Domain()', function() {
        it('should extract domain from url', function() {
            var url = 'https://www.google.com/search?q=rbutr';
            assert.strictEqual(RbutrUtils().url2Domain(url), 'google.com');
        });
    });

    describe('#RbutrUtils.unicode2String()', function() {
        it('should decode unicode characters', function() {
            var string = 'This is just a \u0074\u0065\u0073\u0074.';
            assert.strictEqual(RbutrUtils().unicode2String(string), 'This is just a test.');
        });
    });
});
