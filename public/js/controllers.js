'use strict';

/* Controllers */

function AppCtrl($scope, socket) {

    // Socket listeners
    // ================

    socket.on('init', function(data) {
        $scope.name = data.name;
        $scope.users = data.users;
        $scope.user = data.user;
        console.log('users: ' + JSON.stringify(data.users));
    });
    socket.on('connect', function(data) {

    });
    socket.on('connect_failed', function() {
        console.log('login failed');
    });

    socket.on('send:message', function(message, from) {
        console.log('got message: ' + message + ', from: ' + from);
        $scope.messages.push(message);
    });

    socket.on('change:name', function(data) {
        //changeName(data.oldName, data.newName);
    });

    socket.on('user:join', function(data) {
        $scope.messages.push({
            user: 'chatroom',
            text: 'User ' + data.name + ' has joined.'
        });
        $scope.users.push(data.name);
    });

    // add a message to the conversation when a user disconnects or leaves the room
    socket.on('user:left', function(data) {
        $scope.messages.push({
            user: 'chatroom',
            text: 'User ' + data.name + ' has left.'
        });
        var i, user;
        for (i = 0; i < $scope.users.length; i++) {
            user = $scope.users[i];
            if (user === data.name) {
                $scope.users.splice(i, 1);
                break;
            }
        }
    });

    // Private helpers
    // ===============

    $scope.messages = [];
    $scope.conversations = [];

    $scope.talkto = function(socketid, name) {
        var conversation = {
            type: 'private', // 私聊，2个人
            socketids: [socketid, $scope.user.socketid],
            users: [],
            to: {
                id: socketid,
                name: name
            },
            messages: [{
                user: 'user1',
                text: '123'
            }, {
                user: 'user2',
                text: '456'
            }]
        };
        $scope.conversations.push(conversation);
        console.log($scope.conversations);
    };

    $scope.sendMessage = function(id, message) { // id为房间名，或者私聊时对方的socketid
        console.log('to id: ' + id + ', message: ' + message);

        socket.emit('send:message', {
            message: message,
            to: id,
            from: $scope.name
        });

        // add the message to our model locally
        $scope.messages.push({
            user: $scope.name,
            text: $scope.message
        });

        // clear message box
        $scope.message = '';
    };
}
