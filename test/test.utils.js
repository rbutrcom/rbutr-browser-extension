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
        it('should return an object containing 9 properties', () => {
            assert.strictEqual(Object.keys(RbutrUtils()).length, 9);
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

    describe('#RbutrUtils.unicode2String()', () => {
        it('should decode unicode characters', () => {
            var string = 'This is just a \u0074\u0065\u0073\u0074.';
            assert.strictEqual(RbutrUtils().unicode2String(string), 'This is just a test.');
        });
    });
});
