/*!
 * Rbutr Browser Extension v0.10.0
 * https://github.com/rbutrcom/rbutr-browser-extension
 *
 * Copyright 2012-2017 The Rbutr Community
 * Licensed under LGPL-3.0
 */

/*global global,require,describe,it,beforeEach,afterEach*/
/*jslint esnext:true */

var assert = require('assert');
var rewire = require('rewire');

// Because background.js need utils.js we need to include it and overwrite the global
var utils = rewire('../src/utils.js');
var RbutrUtils = utils.__get__('RbutrUtils');
global.RbutrUtils = RbutrUtils;

// Because background.js need utils.js we need to include it and overwrite the global
var api = rewire('../src/rbutrApi.js');
var RbutrApi = api.__get__('RbutrApi');
global.RbutrApi = RbutrApi;

var background = rewire('../src/background.js');
var Rbutr = background.__get__('Rbutr');
var rbutrObj = Rbutr();


describe('Rbutr', () => {

    describe('#Rbutr()', () => {
        it('should return an object', () => {
            assert.strictEqual(typeof Rbutr(), 'object');
        });
        it('should return an object containing 21 properties', () => {
            assert.strictEqual(Object.keys(Rbutr()).length, 21);
        });
    });

    describe('#Rbutr.utils', () => {
        it('should return an object', () => {
            assert.strictEqual(typeof rbutrObj.utils, 'object');
        });
    });

    describe('#Rbutr.getProp()', () => {
        it('should return an array', () => {
            assert.strictEqual(Array.isArray(rbutrObj.getProp('fromUrls')), true);
        });
        it('should return a boolean', () => {
            assert.strictEqual(rbutrObj.getProp('loggedIn'), false);
        });
        it('should return a string', () => {
            assert.strictEqual(typeof rbutrObj.getProp('submitError'), 'string');
        });
    });

    describe('#Rbutr.setProp()', () => {
        it('should set a value', () => {
            rbutrObj.setProp('submittingRebuttal', null, true);
            assert.strictEqual(rbutrObj.getProp('submittingRebuttal'), true);
        });
        it('should add an element to array', () => {
            rbutrObj.setProp('fromUrls', 0, 'abc');
            assert.strictEqual(rbutrObj.getProp('fromUrls').length, 1);
        });
        it('should delete an element from array', () => {
            rbutrObj.setProp('fromUrls', 0, null);
            assert.strictEqual(rbutrObj.getProp('fromUrls').length, 0);
        });
    });

    describe('#Rbutr.getPropLen()', () => {
        it('should return the length of an array', () => {
            rbutrObj.setProp('fromUrls', 0, '-');
            rbutrObj.setProp('fromUrls', 123, 'abc');
            rbutrObj.setProp('fromUrls', 999, 'xyz');
            assert.strictEqual(rbutrObj.getPropLen('fromUrls'), 3);
        });
        it('should return the length of a string', () => {
            rbutrObj.setProp('submitError', null, 'Lorem ipsum.');
            assert.strictEqual(rbutrObj.getPropLen('submitError'), 12);
        });
    });

    describe('#Rbutr.alreadyExists()', () => {
        it('should return true', () => {
            rbutrObj.setProp('toUrls', 0, 'http://google.com');
            assert.ok(rbutrObj.alreadyExists('http://google.com'));
        });
    });
});
