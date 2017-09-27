/*!
 * Rbutr Browser Extension v0.10.0
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global require,describe,it,beforeEach,afterEach*/
/*jslint esnext:true */

var assert = require('assert');
var rewire = require('rewire');

var utils = rewire('../src/utils.js');
var RbutrUtils = utils.__get__('RbutrUtils');


describe('Utils', () => {

    describe('#RbutrUtils()', () => {
        it('should return an object', () => {
            assert.strictEqual(typeof RbutrUtils(), 'object');
        });
        it('should return an object containing 6 properties', () => {
            assert.strictEqual(Object.keys(RbutrUtils()).length, 6);
        });
    });

    describe('#RbutrUtils.isDev()', () => {
        beforeEach(() => {
            localStorage.clear();
        });
        it('should return true if isDev-Key is "true"', () => {
            localStorage.setItem('rbutr.isDev', 'true');
            assert.strictEqual(RbutrUtils().isDev(), true);
        });
        it('should return false if isDev-Key is not "true" or not set', () => {
            assert.strictEqual(RbutrUtils().isDev(), false);
        });
    });

    describe('#RbutrUtils.url2Domain()', () => {
        it('should extract domain from url', () => {
            var url = 'https://www.google.com/search?q=rbutr';
            assert.strictEqual(RbutrUtils().url2Domain(url), 'google.com');
        });
    });

    describe('#RbutrUtils.getCanonicalUrl()', () => {
        it('should return false on empty URL', () => {
            assert.strictEqual(RbutrUtils().getCanonicalUrl(), false);
        });
        it('should return false on relative url without leading /', () => {
            var url = 'test.html';
            assert.strictEqual(RbutrUtils().getCanonicalUrl(url), false);
        });
        it('should return full URL on relative URL', () => {
            var url = '/test.html';
            assert.strictEqual(RbutrUtils().getCanonicalUrl(url), 'about://' + url);
        });
        it('should return full URL if it is absolute', () => {
            var url = 'https://www.google.com/search?q=rbutr';
            assert.strictEqual(RbutrUtils().getCanonicalUrl(url), url);
        });
    });

    describe('#RbutrUtils.unicode2String()', () => {
        it('should decode unicode characters', () => {
            var string = 'This is just a \u0074\u0065\u0073\u0074.';
            assert.strictEqual(RbutrUtils().unicode2String(string), 'This is just a test.');
        });
    });
});
