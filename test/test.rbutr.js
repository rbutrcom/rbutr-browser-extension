/*global global,require,describe,it,beforeEach,afterEach*/
/*jslint esnext:true */

var assert = require('assert');
var rewire = require('rewire');

// Because background.js need utils.js we need to include it and overwrite the global
var utils = rewire('../src/utils.js');
var RbutrUtils = utils.__get__('RbutrUtils');
global.RbutrUtils = RbutrUtils;

var background = rewire('../src/background.js');
var Rbutr = background.__get__('Rbutr');
var rbutrObj = Rbutr();


describe('Rbutr', function() {

    describe('#Rbutr()', function() {
        it('should return an object', function() {
            assert.strictEqual(typeof Rbutr(), 'object');
        });
    });

    describe('#Rbutr.utils', function() {
        it('should return an object', function() {
            assert.strictEqual(typeof rbutrObj.utils, 'object');
        });
    });

    describe('#Rbutr.getProp()', function() {
        it('should return an array', function() {
            assert.strictEqual(Array.isArray(rbutrObj.getProp('fromUrls')), true);
        });
        it('should return a boolean', function() {
            assert.strictEqual(rbutrObj.getProp('loggedIn'), false);
        });
        it('should return a string', function() {
            assert.strictEqual(typeof rbutrObj.getProp('submitError'), 'string');
        });
    });

    describe('#Rbutr.setProp()', function() {
        it('should set a value', function() {
            rbutrObj.setProp('submittingRebuttal', null, true);
            assert.strictEqual(rbutrObj.getProp('submittingRebuttal'), true);
        });
        it('should add an element to array', function() {
            rbutrObj.setProp('fromUrls', 0, 'abc');
            assert.strictEqual(rbutrObj.getProp('fromUrls').length, 1);
        });
        it('should delete an element from array', function() {
            rbutrObj.setProp('fromUrls', 0, null);
            assert.strictEqual(rbutrObj.getProp('fromUrls').length, 0);
        });
    });

    describe('#Rbutr.getPropLen()', function() {
        it('should return the length of an array', function() {
            rbutrObj.setProp('fromUrls', 0, '-');
            rbutrObj.setProp('fromUrls', 123, 'abc');
            rbutrObj.setProp('fromUrls', 999, 'xyz');
            assert.strictEqual(rbutrObj.getPropLen('fromUrls'), 3);
        });
        it('should return the length of a string', function() {
            rbutrObj.setProp('submitError', null, 'Lorem ipsum.');
            assert.strictEqual(rbutrObj.getPropLen('submitError'), 12);
        });
    });

    describe('#Rbutr.getCid()', function() {
        afterEach(() => {
            localStorage.clear();
        });
        it('should return an integer', function() {
            assert.ok(Number.isInteger(Rbutr().getCid()));
        });
        it('should return a 17 character long value', function() {
            assert.equal(Rbutr().getCid(true).toString().length, 17);
        });
    });

    describe('#Rbutr.alreadyExists()', function() {
        it('should return true', function() {
            rbutrObj.setProp('toUrls', 0, 'http://google.com');
            assert.ok(rbutrObj.alreadyExists('http://google.com'));
        });
    });
});
