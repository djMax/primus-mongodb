var http = require('http'),
    assert = require('assert'),
    Primus = require('primus'),
    cb = require('assert-called'),
    PrimusMongo = require('../'),
    MongoClient = require('mongodb').MongoClient,
    PORT = 3456;

require('longjohn');

describe('primus-mongodb', function () {

    var server,
        primus0,
        primus1,
        client0,
        client1,
        waiting,
        d = new Date().getTime();

    function getPrimus() {
        var server = http.createServer();
        var primus = new Primus(server, {
            mongo: {
                url: 'mongodb://localhost:27017/primus-test-db',
                collection: 'primus-test'
            },
            transformer: 'websockets'
        });
        primus.use('Mongo', PrimusMongo);
        server.listen(PORT++);
        return primus;
    }

    // Cleanup any existing collection
    before(function (done) {
        MongoClient.connect('mongodb://localhost:27017/primus-test-db', function (err, db) {
            if (err) {
                return done(err);
            }
            db.collection('primus-test').drop(function () {
                // Don't care if this fails, as the collection probably doesn't exist.
                done();
            });
        });
    });

    it('should create primus servers', function createServers() {
        primus0 = getPrimus();
        primus1 = getPrimus();
    });

    it('should create client 1', function createClient1(done) {
        client0 = new (primus0.Socket)('http://localhost:' + --PORT);
        client0.on('open', cb(function () {
            console.log('client 1 open');
            done();
        }));
        client0.on('data', cb(function (msg) {
            console.log('client 1 got message', msg);
            assert.equal(msg.msg, 'hello world ' + d);
            waiting();
        }));
    });

    it('should create client 0', function createClient0(done) {
        client1 = new (primus1.Socket)('http://localhost:' + --PORT);
        client1.on('open', cb(function () {
            console.log('client 1 open');
            done();
        }));
        client1.on('data', cb(function (msg) {
            console.log('client 1 got message', msg);
            assert.equal(msg.msg, 'hello world ' + d);
            waiting();
        }));
    });

    it('should work with an explicit mongo client', function explicitClient(done) {
        MongoClient.connect('mongodb://localhost:27017/primus-test-db', function (err, db) {
            var server = http.createServer();
            var primus = new Primus(server, {
                mongo: {
                    client: db,
                    collection: 'primus-test'
                },
                transformer: 'websockets'
            });
            primus.use('Mongo', PrimusMongo);
            done(err);
        });
    });

    it('should send and receive messages', function sendAndReceivePrimus(done) {
        var inboundExpected = 4;
        waiting = function () {
            if (--inboundExpected === 0) {
                client0.end();
                client1.end();
                done();
            }
        };
        primus0.write({msg: 'hello world ' + d, from: 'client0'});
        setTimeout(function () {
            primus1.write({msg: 'hello world ' + d, from: 'client1'});
        }, 1000);
    });

});