/* global _ */

'use strict';

/* Controllers */

function AppCtrl($scope, socket) {

    // Socket listeners
    // ================

    socket.on('init', function(data) {
        $scope.name = data.name; // 当前用户名
        $scope.users = data.users; // 当前的所有用户，不包含当前用户
        $scope.user = data.user; // 当前用户
        $scope.groups = data.groups; // 所有群组
        console.log('other_users: ' + JSON.stringify(data.users));
    });
    socket.on('connect', function(data) {

    });
    socket.on('error', function() {
        console.log('error!!!');
        window.location.href = 'http://localhost:3000/login';
    });

    // 接受私聊消息
    socket.on('send:message', function(data) {
        // 接收到消息的时候，判断conversation是否存在，不存在则创建一个，存在则添加消息
        // 接收到消息的时候, conversation是反的。。
        console.log('[client][send:message] data : ' + JSON.stringify(data));
        var conversation = _.filter($scope.conversations, function(c) {
            return (c.from.id === data.from.id && c.to.id === data.to.id) ||
                (c.from.id === data.to.id && c.to.id === data.from.id);
        });
        if (conversation.length === 0) {
            var c = {
                type: 'private', // 私聊，2个人
                from: {
                    id: data.to.id,
                    name: data.to.name
                },
                to: {
                    id: data.from.id,
                    name: data.from.name
                },
                messages: [{
                    user: data.from.name,
                    text: data.message
                }]
            };
            $scope.conversations.push(c);
        } else {
            conversation[0].messages.push({
                user: data.from.name,
                text: data.message
            });
        }
        //$scope.messages.push(message);
    });

    // 接受群组消息
    socket.on('send:group', function(data) {

        console.log('[client][send:group] data: ' + JSON.stringify(data));
        var conversation = _.filter($scope.conversations, function(c) {
            return (c.type === 'group' && c.to.name === data.to.name);
        });
        if (conversation.length === 0) {
            var c = {
                type: 'group', // 私聊，2个人
                from: {
                    id: data.from.id,
                    name: data.from.name
                },
                to: {
                    id: data.to.id,
                    name: data.to.name
                },
                messages: [{
                    user: data.from.name,
                    text: data.message
                }]
            };
            $scope.conversations.push(c);
        } else {
            conversation[0].messages.push({
                user: data.from.name,
                text: data.message
            });
        }
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
        console.log('[client][user:join] ' + JSON.stringify(data));
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
        console.log('[client][user:left] ' + JSON.stringify(data));
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

    // 私聊
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
            messages: []
        };
        $scope.conversations.push(conversation);
        console.log($scope.conversations);
    };

    // 发送 私聊消息
    $scope.sendMessage = function(from, to, message) {
        console.log('[client][sendMessage] from : ' + JSON.stringify(from) + ', to: ' + JSON.stringify(to) + ', message: ' + message);

        socket.emit('send:message', {
            message: message,
            from: from,
            to: to
        });
        var conversation = _.filter($scope.conversations, function(c) {
            return (c.from.id === from.id && c.to.id === to.id) ||
                (c.from.id === to.id && c.to.id === from.id);
        });
        conversation[0].messages.push({
            user: from.name,
            text: message
        });
        $scope.message = '';
    };

    // 群组聊天
    $scope.talktoGroup = function (group, name) {
        var conversation = {
            type: 'group', // 群组，多个人
            to: {
                id: group.id,
                name: group.name
            },
            from: {
                id: $scope.user.socketid,
                name: $scope.user.username
            },
            messages: []
        };
        $scope.conversations.push(conversation);
        console.log($scope.conversations);
        socket.emit('group:join',  {
            group: {
                id: group.id,
                name: group.name
            },
            user: {
                id: $scope.user.socketid,
                name: $scope.user.username
            }
        });
    };

    // 发送消息给 群组
    $scope.sendMessageToGroup = function(from, to, message) {
        socket.emit('send:group', {
            message: message,
            from: from,
            to: to
        });
        console.log('[client][sendMessageToGroup] from: ' + JSON.stringify(from) + ',t o: ' + JSON.stringify(to) + ', message: ' + message);
        var conversation = _.filter($scope.conversations, function(c) {
            return (c.type === 'group' && c.to.name === to.name);
        });
        console.log('[sendMessageToGroup] conversation: ' + JSON.stringify(conversation));
        conversation[0].messages.push({
            user: from.name,
            text: message
        });
        $scope.message = '';
    };
}
