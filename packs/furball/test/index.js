// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Furball = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Furball', function () {

    it('returns current version', function (done) {

        var server = new Hapi.Server();
        server.pack.require('../', { version: '/VERSION' }, function (err) {

            expect(err).to.not.exist;
            server.inject({ method: 'GET', url: '/VERSION' }, function (res) {

                expect(res.result).to.equal(Hapi.utils.loadPackage().version);
                done();
            });
        });
    });

    it('returns current plugins', function (done) {

        var server = new Hapi.Server();
        server.pack.require('../', function (err) {

            expect(err).to.not.exist;
            server.inject({ method: 'GET', url: '/plugins' }, function (res) {

                expect(res.result).to.deep.equal([{ name: 'furball', version: Hapi.utils.loadPackage().version }]);
                done();
            });
        });
    });

    it('returns current plugins via API', function (done) {

        var server = new Hapi.Server();
        server.pack.require('../', function (err) {

            expect(err).to.not.exist;
            expect(server.plugins.furball.plugins(server)).to.deep.equal([{ name: 'furball', version: Hapi.utils.loadPackage().version }]);
            done();
        });
    });
});


