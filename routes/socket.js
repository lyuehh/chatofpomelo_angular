/* global io */

var stringify = require('json-stringify-safe');
var _ = require('underscore');

var users = []; // 连接上的所有用户
// export function for listening to the socket
module.exports = function(socket) {
    var user = socket.handshake.user;
    var name = user.username;
    user.socketid = socket.id;
    // 已经连接上的，就不再添加了

    console.log('current: ' + stringify(user));

    var otherUsers = _.filter(users, function(i) {
        return i.username !== name;
    });
    var exist = _.filter(users, function(i) {
        return i.username === name;
    });

    console.log('other: ' + stringify(otherUsers));
    console.log('exist: ' + stringify(exist));

    if (exist.length === 0) {
        users.push(user);
    }

    console.log('users: ' + JSON.stringify(users));


    // send the new user their name and a list of users
    socket.emit('init', {
        name: name,
        user: user, // 当前用户
        users: otherUsers // 所有用户
    });

    // notify other clients that a new user has joined
    socket.broadcast.emit('user:join', {
        name: name
    });

    // broadcast a user's message to other users
    socket.on('send:message', function(data) {
        /*
        socket.broadcast.emit('send:message', {
            user: name,
            text: data.message
        });
        */

        io.sockets.socket(data.id).emit('send:message', data.message, data.from);
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

    // clean up when a user leaves, and broadcast it to other users
    socket.on('disconnect', function() {
        socket.broadcast.emit('user:left', {
            name: name
        });
        console.log('disconnect: ' + name);
        
        users = _.filter(users, function(i) {
            return i.username !== name;
        });
    });
};