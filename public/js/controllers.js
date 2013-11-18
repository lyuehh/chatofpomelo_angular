/* global _ */

'use strict';

/* Controllers */

function AppCtrl($scope) {

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
