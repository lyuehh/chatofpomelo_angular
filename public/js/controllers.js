/* global _, name, email */
/* name, email was in index.jade */

'use strict';

/* Controllers */

function AppCtrl($scope) {

    //$scope.users = ['1', '2'];
    //$scope.user = name;
    $scope.groups = [{name: 'group1'}, {name: 'group2'}, {name: 'group3'}];

    // query connector
    pomelo.init({
        host: window.location.hostname,
        port: 3014,
        log: true
    }, function() {
        pomelo.request('gate.gateHandler.queryEntry', {
            uid: email
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
                pomelo.request("connector.entryHandler.enter", {
                    username: name,
                    rid: email.split('@')[1]
                }, function(data) {
                    if(data.error) {
                        console.log('name already taken, choose another');
                        //showError(DUPLICATE_ERROR);
                        return;
                    }
                    $scope.users = data.users;
                    $scope.user = name;
                    $scope.$apply();
                });
            });
            //callback(data.host, data.port);
        });
    });

    //wait message from the server.
    pomelo.on('onChat', function(data) {
        console.log('[client][onChat] data: ' + JSON.stringify(data));
        if (data.type === 'private') {
            var conversation = _.filter($scope.conversations, function(c) {
                return (c.from === data.from && c.to === data.to) ||
                    (c.from === data.to && c.to === data.from);
            });
            if (name === data.from) {
                return;
            }
            if (conversation.length === 0) {
                var c = {
                    type: 'private', // 私聊，2个人
                    from: data.to,
                    to: data.from,
                    messages: [{
                        user: data.from,
                        message: data.message
                    }]
                };
                $scope.conversations.push(c);
            } else {
                conversation[0].messages.push({
                    user: data.from,
                    message: data.message
                });
            }
        } else if (data.type === 'group') {
            var conversation = _.filter($scope.conversations, function(c) {
                return c.to === data.to;
            });
            if (name === data.from) {
                return;
            }
            if (conversation.length === 0) {
                var c = {
                    type: 'group', // 群组聊天
                    from: data.from,
                    to: data.to,
                    messages: [{
                        user: data.from,
                        message: data.message
                    }]
                };
                $scope.conversations.push(c);
            } else {
                conversation[0].messages.push({
                    user: data.from,
                    message: data.message
                });
            }
        }
        
        $scope.$apply();
        //addMessage(data.from, data.target, data.msg);
        //$("#chatHistory").show();
        //if(data.from !== username)
        //    tip('message', data.from);
    });

    //update user list
    pomelo.on('onAdd', function(data) {
        console.log('[client][onAdd] data: ' + JSON.stringify(data));
        $scope.users.push(data.user);
        $scope.$apply();
    });

    //update user list
    pomelo.on('onLeave', function(data) {
        console.log('[client][onLeave] data: ' + JSON.stringify(data));
        $scope.users = _.filter($scope.users, function(u) {
            return u !== data.user;
        });
        $scope.$apply();
    });


    //handle disconect message, occours when the client is disconnect with servers
    pomelo.on('disconnect', function(reason) {
        console.log('[client][disconnect] reason: ' + JSON.stringify(reason));
        //showLogin();
    });

    // Private helpers
    // ===============

    $scope.messages = [];
    $scope.conversations = [];

    // 私聊, 弹出消息框
    $scope.talkto = function(name, type) {
        var conversation = {
            type: type, // type
            to: name,
            from: $scope.user,
            messages: []
        };
        $scope.conversations.push(conversation);
    };

    // 发送 消息
    $scope.sendMessage = function(from, to, message, type) {
        console.log('[client][sendMessage] from : ' + from + ', to: ' + to + ', message: ' + message);
        var cid;
        if (type === 'private') {
            cid = from + '_' + to;
        } else if (type === 'group') {
            cid = to;
        } else if (type === 'domain') {
            cid = 'domain'; // example.com
        }
        pomelo.request("chat.chatHandler.send", {
            type: type,
            cid: cid,
            message: message,
            from: from,
            to: to
        }, function(data) {
            console.log('[client][chatHandler][send] got: ' + JSON.stringify(data));
        });

        var conversation = _.filter($scope.conversations, function(c) {
            return (c.from === from && c.to === to) ||
                (c.from === to && c.to === from);
        });
        conversation[0].messages.push({
            user: from,
            message: message
        });
        $scope.message = '';
    };
}
