'use strict';

/* Controllers */

function AppCtrl($scope, socket) {

    // Socket listeners
    // ================

    socket.on('init', function(data) {
        $scope.name = data.name; // 当前用户名
        $scope.users = data.users; // 当前的所有用户，不包含当前用户
        $scope.user = data.user; // 当前用户
        console.log('other_users: ' + JSON.stringify(data.users));
    });
    socket.on('connect', function(data) {

    });
    socket.on('error', function() {
        console.log('error!!!');
    });

    socket.on('send:message', function(data) {
        console.log('[client]: got message: ' + JSON.stringify(data));
        //$scope.messages.push(message);
    });

    socket.on('change:name', function(data) {
        //changeName(data.oldName, data.newName);
    });

    socket.on('user:join', function(data) {
        /*
        $scope.messages.push({
            user: 'chatroom',
            text: 'User ' + data.name + ' has joined.'
        });
        */
        console.log('[user:join] ' + JSON.stringify(data));
        $scope.users.push(data.user);
        console.log('$scope.users: ' + JSON.stringify($scope.users));
    });

    // add a message to the conversation when a user disconnects or leaves the room
    socket.on('user:left', function(data) {
        /*
        $scope.messages.push({
            user: 'chatroom',
            text: 'User ' + data.name + ' has left.'
        });
        */
        console.log('[user:left] ' + JSON.stringify(data));
        var i, user;
        for (i = 0; i < $scope.users.length; i++) {
            user = $scope.users[i];
            if (user.username === data.user.username) {
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
            to: {
                id: socketid,
                name: name
            },
            from: {
                id: $scope.user.socketid,
                name: $scope.user.username
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

    $scope.sendMessage = function(from, to, message) {
        console.log('from : ' + JSON.stringify(from) + ', to: ' + JSON.stringify(to) + ', message: ' + message);

        socket.emit('send:message', {
            message: message,
            from: from,
            to: to
        });
/*
        // add the message to our model locally
        $scope.messages.push({
            user: $scope.name,
            text: $scope.message
        });

        // clear message box
        $scope.message = ''; */
    };
}
