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

const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = '';
const options = {};
const dom = new JSDOM(html, options);

global.window = dom.window;
global.browser = dom.window.browser;


// Because rbutrApi.js need utils.js we need to include it and overwrite the global
var utils = rewire('../src/utils.js');
var RbutrUtils = utils.__get__('RbutrUtils');
var utilsObj = RbutrUtils();

var api = rewire('../src/rbutrApi.js');
var RbutrApi = api.__get__('RbutrApi');


describe('RbutrApi', () => {

    describe('#RbutrApi()', () => {
        it('should return an object', () => {
            assert.strictEqual(typeof RbutrApi(), 'object');
        });
        it('should return an object containing 5 properties', () => {
            assert.strictEqual(Object.keys(RbutrApi()).length, 5);
        });
    });

    describe('#RbutrApi.getCid()', () => {
        beforeEach(() => {
            localStorage.clear();
        });
        it('should return an integer', () => {
            assert.ok(Number.isInteger(RbutrApi().getCid()));
        });
        it('should return a 17 character long value', () => {
            assert.equal(RbutrApi().getCid(true).toString().length, 17);
        });
        it('should return the currently set cid', () => {
            localStorage.setItem('rbutr.cid', 1231231231231231);
            assert.strictEqual(RbutrApi().getCid(), 1231231231231231);
        });
    });

    describe('#RbutrApi.getServerUrl()', () => {
        afterEach(() => {
            localStorage.clear();
        });
        it('should return https://russell.rbutr.com/rbutr/PluginServlet in dev mode', () => {
            localStorage.setItem('rbutr.isDev', 'true');
            assert.strictEqual(RbutrApi(utilsObj).getServerUrl(), 'https://russell.rbutr.com/rbutr/PluginServlet');
        });
        it('should return http://rbutr.com/rbutr/PluginServlet in productive mode', () => {
            assert.strictEqual(RbutrApi(utilsObj).getServerUrl(), 'http://rbutr.com/rbutr/PluginServlet');
        });
    });

    describe('#RbutrApi.getServerUrl(true)', () => {
        afterEach(() => {
            localStorage.clear();
        });
        it('should return https://russell.rbutr.com in dev mode', () => {
            localStorage.setItem('rbutr.isDev', 'true');
            assert.strictEqual(RbutrApi(utilsObj).getServerUrl(true), 'https://russell.rbutr.com');
        });
        it('should return http://rbutr.com in productive mode', () => {
            assert.strictEqual(RbutrApi(utilsObj).getServerUrl(true), 'http://rbutr.com');
        });
    });

    describe('#RbutrApi.getMenu(function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).getMenu((success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

});
