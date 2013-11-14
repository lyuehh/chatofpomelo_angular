/**
 * Module dependencies.
 */

var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);

// Hook Socket.io into Express
var io = require('socket.io').listen(server, {
    'log level': 0
});

var routes = require('./routes/index.js');
//var socket = require('./routes/socket.js');
var users = require('./model/users.js').users;

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
    io.set('log level', 2);
});

app.configure('production', function() {
    app.use(express.errorHandler());
    io.set('log level', 1);
});

app.configure('test', function() {
    io.set('log level', 0);
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
}

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

io.sockets.on('connection', function(socket) {
    var user = socket.handshake.user;
    var name = user.username;
    user.socketid = socket.id;
    // 已经连接上的，就不再添加了

    console.log('current: ' + stringify(user));

    var otherUsers = _.filter(connectedUsers, function(i) {
        return i.username !== name;
    });
    var exist = _.filter(connectedUsers, function(i) {
        return i.username === name;
    });

    console.log('other: ' + stringify(otherUsers));
    console.log('exist: ' + stringify(exist));

    if (exist.length === 0) {
        connectedUsers.push(user);
    }

    console.log('connectedUsers: ' + JSON.stringify(connectedUsers));


    // send the new user their name and a list of connectedUsers
    socket.emit('init', {
        name: name,
        user: user, // 当前用户
        users: otherUsers // 所有用户
    });

    // notify other clients that a new user has joined
    socket.broadcast.emit('user:join', {
        user: user
    });

    // send a user's message to other connectedUsers
    socket.on('send:message', function(data) {
        /*
        socket.broadcast.emit('send:message', {
            user: name,
            text: data.message
        });
        */
        console.log('server [send:message]: ' + stringify(data));
        io.sockets.socket(data.to.id).emit('send:message', data);
    });

    // validate a user's name change, and broadcast it on success
    socket.on('change:name', function(data, fn) {
        /*
        socket.broadcast.emit('change:name', {
            oldName: oldName,
            newName: name
        });
        */
    });

    // clean up when a user leaves, and broadcast it to other connectedUsers
    socket.on('disconnect', function() {
        socket.broadcast.emit('user:left', {
            user: user
        });
        console.log('disconnect: ' + stringify(user));
        
        connectedUsers = _.filter(connectedUsers, function(i) {
            return i.username !== name;
        });
    });
});


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
