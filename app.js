/**
 * Module dependencies.
 */

var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);


var routes = require('./routes/index.js');
//var socket = require('./routes/socket.js');
var users = require('./model/users.js').users;
var groups = require('./model/groups.js').groups;

var _ = require('underscore');
var flash = require('connect-flash');
var stringify = require('json-stringify-safe');

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

function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByUsername(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function(err, user) {
        done(err, user);
    });
});

// passport
passport.use(new LocalStrategy(
    function(username, password, done) {
        findByUsername(username, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Unknown user ' + username
                });
            }
            if (user.password !== password) {
                return done(null, false, {
                    message: 'Invalid password'
                });
            }
            return done(null, user);
        });
    }
));

// Configuration

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
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

app.configure('test', function() {
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
}


// Routes

app.get('/', routes.login);
app.get('/index', ensureAuthenticated, routes.index);
// app.get('/partials/:name', routes.partials);
app.post('/login', passport.authenticate('local', {
    successRedirect: '/index',
    failureRedirect: '/login',
    failureFlash: true
}));
app.get('/login', function(req, res, next) {
    res.render('login', { user: req.user, message: req.flash('error') });
});

// redirect all others to the index (HTML5 history)
// app.get('*', routes.login);

// Socket.io Communication

var connectedUsers = []; // 连接上的所有用户


var start = exports.start = function() {
    // Start server
    server.listen(app.get('port'), function() {
        //console.log('server running on %s', app.get('port'));
    });
};

var stop = exports.stop = function() {
    server.close();
};

start();
