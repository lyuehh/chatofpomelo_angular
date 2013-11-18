/* global _ */

'use strict';

/* Controllers */

function AppCtrl($scope) {

    // query connector
    var route = 'gate.gateHandler.queryEntry';
    pomelo.init({
        host: window.location.hostname,
        port: 3014,
        log: true
    }, function() {
        pomelo.request(route, {
            uid: '111'
        }, function(data) {
            pomelo.disconnect();
            if(data.code === 500) {
                //showError(LOGIN_ERROR);
                console.log("LOGIN ERROR!!");
                return;
            }
            pomelo.init({
                host: data.host,
                port: data.port,
                log: true
            }, function() {
                var route = "connector.entryHandler.enter";
                pomelo.request(route, {
                    username: '111',
                    rid: '111'
                }, function(data) {
                    if(data.error) {
                        console.log('name already taken, choose another');
                        //showError(DUPLICATE_ERROR);
                        return;
                    }
                    console.log(data.users);
                    $scope.users = data.users;
                    //setName();
                    //setRoom();
                    //showChat();
                    //initUserList(data);
                });
            });
            //callback(data.host, data.port);
        });
    });

    //wait message from the server.
    pomelo.on('onChat', function(data) {
        //addMessage(data.from, data.target, data.msg);
        //$("#chatHistory").show();
        //if(data.from !== username)
        //    tip('message', data.from);
    });

    //update user list
    pomelo.on('onAdd', function(data) {
        //var user = data.user;
        //tip('online', user);
        //addUser(user);
    });

    //update user list
    pomelo.on('onLeave', function(data) {
        //var user = data.user;
        //tip('offline', user);
        //removeUser(user);
    });


    //handle disconect message, occours when the client is disconnect with servers
    pomelo.on('disconnect', function(reason) {
        //showLogin();
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

        pomelo.request("chat.chatHandler.send", {
            rid: rid,
            content: msg,
            from: username,
            target: target
        }, function(data) {
            //$("#entry").attr("value", ""); // clear the entry field.
            //if(target != '*' && target != username) {
            //    addMessage(username, target, msg);
            //    $("#chatHistory").show();
            //}
        });
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
