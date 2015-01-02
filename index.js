var mubsub = require('mubsub');

var PrimusMongo = module.exports = function (primus, options) {
    var publishQueue = [],
        subscribed = false,
        client, channel;

    function getClient() {
        if (!options.mongo) {
            throw new Error('You must specify a mongo property in the configuration of primus.');
        }
        if (options.mongo.url) {
            return mubsub(options.mongo.url);
        }

        if (!options.mongo.client) {
            throw new Error('You must specify a url or client property in the mongo key of your configuration');
        }
        return options.mongo.client;
    }

    client = getClient();
    channel = client.channel(options.mongo.collection || 'primus', options.mongo);

    primus.transform('outgoing', function (packet, next) {
        //
        // Waiting until we're subscribed is the best we can do to ensure that
        // messages are delivered.
        //
        if (subscribed) {
            channel.publish('primusEvent', packet.data, function (err) {
                if (err) {
                    publishQueue.push(packet.data);
                    subscribed = false;
                    next(err);
                } else {
                    // The inbound event will take care of the actual completion.
                    next(undefined, false);
                }
            });
            return;
        } else {
            publishQueue.push(packet.data);
            next();
        }
    });

    channel.on('primusEvent', function (msg) {
        // We essentially have to duplicate the code in primus.write because we need to get...get...get...get low.
        primus.forEach(function forEach(spark) {
            spark._write(msg);
        });
    });
    channel.on('ready', function () {
        subscribed = true;
        publishQueue.forEach(function (data) {
            channel.publish('primusEvent', data);
        });
        publishQueue.length = 0;
    });

};

// Hack so that you can `primus.use(require('primus-mongodb'))`.
PrimusMongo.server = PrimusMongo;