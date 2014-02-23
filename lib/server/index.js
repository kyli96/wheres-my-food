var express = require('express');
var derby = require('derby');
var racerBrowserChannel = require('racer-browserchannel');
var liveDbMongo = require('livedb-mongo');
var MongoStore = require('connect-mongo')(express);
var app = require('../app');

var expressApp = module.exports = express();

// Get Redis configuration
if (process.env.REDIS_HOST) {
    var redis = require('redis').createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
    redis.auth(process.env.REDIS_PASSWORD);
} else if (process.env.REDISCLOUD_URL) {
    var redisUrl = require('url').parse(process.env.REDISCLOUD_URL);
    var redis = require('redis').createClient(redisUrl.port, redisUrl.hostname, {no_ready_check: true});
    redis.auth(redisUrl.auth.split(":")[1]);
} else {
    var redis = require('redis').createClient();
}
redis.select(process.env.REDIS_DB || 1);
// Get Mongo configuration 
var mongoUrl = process.env.MONGO_URL || process.env.MONGOHQ_URL ||
    'mongodb://localhost:27017/wheres-my-food';

// The store creates models and syncs data
var store = derby.createStore({
    db: {
        db: liveDbMongo(mongoUrl + '?auto_reconnect', {safe: true})
        , redis: redis
    }
});

function createUserId(req, res, next) {
  var model = req.getModel();
  var userId = req.session.userId || (req.session.userId = model.id());
  model.set('_session.userId', userId);
  next();
}

expressApp.
    use(express.favicon()).
    use(express.compress()).
    use(app.scripts(store)).
    use(racerBrowserChannel(store)).
    use(store.modelMiddleware()).
    use(express.cookieParser()).
    use(express.session({
        secret: process.env.SESSION_SECRET || 'TESTING',
        store: new MongoStore({url: mongoUrl, safe: true})
    })).
    use(createUserId).
    use(app.router()).
    use(expressApp.router);

// SERVER-SIDE ROUTES //

expressApp.all('*', function(req, res, next) {
    next('404: ' + req.url);
});
