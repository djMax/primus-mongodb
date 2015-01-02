# primus-mongodb
[![Build Status](https://travis-ci.org/djMax/primus-mongodb.png)](https://travis-ci.org/djMax/primus-mongodb)

`primus-mongodb` is a MongoDB store for [Primus](https://github.com/primus/primus).
It takes care of distributing messages to other instances using [MongoDB Pub/Sub](https://github.com/scttnlsn/mubsub).

*Note:* this is a very simple module for broadcasting all your messages over
MongoDB to *all* connected clients.

## Usage

You can use `primus-mongodb` with a mongo url or mongo client.


```js
var http = require('http'),
    Primus = require('primus'),
    PrimusMongo = require('primus-mongodb');

var server = http.createServer();
var primus = new Primus(server, {
  mongo: {
    url: 'mongodb://localhost:27017/primus-test-db',
    // Or you could pass client: mongodb instance
    collection: 'primus-test' // optional, defaults to primus
    // You can also pass arguments to mubsub such as collection size or max documents
  },
  transformer: 'websockets'
});
primus.use('Mongo', PrimusMongo);

//
// This'll take care of sending the message to all other instances connected
// to the same Redis channel.
//
primus.write('Hello world!'); 
```

Inspired by [primus-redis](https://github.com/mmalecki/primus-redis)
