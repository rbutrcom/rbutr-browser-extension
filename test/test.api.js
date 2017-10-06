/*!
 * Rbutr Browser Extension v0.12.0
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
        it('should return an object containing 12 properties', () => {
            assert.strictEqual(Object.keys(RbutrApi()).length, 12);
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

    describe('#RbutrApi.buildRequestUrl(url, params)', () => {
        /*
        // Skip these until there's a way to mock URL objects
        beforeEach(() => {
            localStorage.setItem('rbutr.cid', 1231231231231231);
        });
        afterEach(() => {
            localStorage.clear();
        });
        it('should return URL with standard params', () => {
            const expected = 'http://rbutr.com/rbutr/PluginServlet?isTest=true&version=0.1&cid=1231231231231231';
            assert.strictEqual(RbutrApi(utilsObj).buildRequestUrl('http://rbutr.com/rbutr/PluginServlet', {isTest:true}), expected);
        });
        it('should return URL with given params and standard params', () => {
            const expected = 'http://rbutr.com/rbutr/PluginServlet?version=0.1&cid=1231231231231231';
            assert.strictEqual(RbutrApi(utilsObj).buildRequestUrl('http://rbutr.com/rbutr/PluginServlet', {}), expected);
        });
        */
        it('should return false on invalid URL', () => {
            assert.strictEqual(RbutrApi(utilsObj).buildRequestUrl('', {}), false);
        });
    });

    describe('#RbutrApi.getMenu(function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).getMenu((success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

    describe('#RbutrApi.getRebuttals(string, function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).getRebuttals('', (success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

    describe('#RbutrApi.submitRebuttals(object, function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).submitRebuttals({}, (success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

    describe('#RbutrApi.submitIdea(object, function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).submitIdea({}, (success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

    describe('#RbutrApi.submitRebuttalRequest(object, function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).submitRebuttalRequest({}, (success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

    describe('#RbutrApi.updateVotes(object, function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).updateVotes({}, (success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

    describe('#RbutrApi.getTags(function)', () => {
        it('should call the passed callback function', () => {
            RbutrApi(utilsObj).getTags((success, result) => {
                assert.strictEqual(typeof success, 'boolean');
            });
        });
    });

});
