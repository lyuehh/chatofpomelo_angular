/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes/index.js');
var socket = require('./routes/socket.js');

var _ = require('underscore');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var passportSocketIo = require('passport.socketio');

var MemoryStore = express.session.MemoryStore,
    sessionStore = new MemoryStore(),
    sessionSecret = 'asdasdsdas1312312',
    sessionKey = 'imchat',
    sessionOptions = {
        store: sessionStore,
        key: sessionKey,
        secret: sessionSecret
    };

var app = module.exports = express.createServer();

// passport
passport.use(new LocalStrategy(
    function(username, password, done) {
        if (username === 'abc' && password === '1234') {
            return done(null, {
                name: 'jose',
                mail: 'j@f.r'
            });
        } else {
            return done(null, false, {
                message: 'wrong user name or password'
            });
        }
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


// Configuration

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', {
        layout: false
    });
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session(sessionOptions));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

// Hook Socket.io into Express
var io = require('socket.io').listen(app, {
    'log level': 2
});

io.set('authorization', passportSocketIo.authorize({
    cookieParser: express.cookieParser, //or connect.cookieParser
    key: 'imchat', //the cookie where express (or connect) stores its session id.
    secret: 'asdasdsdas1312312', //the session secret to parse the cookie
    store: sessionStore, //the session store that express uses
    fail: function(data, accept) { // *optional* callbacks on success or fail
        accept(null, false); // second param takes boolean on whether or not to allow handshake
    },
    success: function(data, accept) {
        accept(null, true);
    }
}));

// Routes

app.get('/', routes.login);
app.get('/index', routes.index);
app.get('/partials/:name', routes.partials);
app.post('/login', passport.authenticate('local', { successRedirect: '/index',
                                                      failureRedirect: '/login',
                                                      failureFlash: true }));

// redirect all others to the index (HTML5 history)
app.get('*', routes.login);

// Socket.io Communication

io.sockets.on('connection', socket);

// Start server

app.listen(3000, function() {
    console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);
});