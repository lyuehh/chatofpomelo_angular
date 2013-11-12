var request = require('request');
var setSocketIOHandshakeCookies = require('./fixture/setSocketIOHandshakeCookies');
var should = require('should');

var app = require('../app');

var io = require('socket.io-client');

describe('authorizer', function() {

    //start and stop the server 
    before(app.start);
    after(app.stop);

    //create a new session for every test
    beforeEach(function() {
        this.cookies = request.jar();
        console.log(setSocketIOHandshakeCookies);
        setSocketIOHandshakeCookies(this.cookies);
        console.log('-------------------------');
        console.log('cookie: ' + JSON.stringify(this.cookies));
    });


    describe('when the user is not logged in', function() {

        it('should emit error with unauthorized handshake', function(done) {
            var socket = io.connect('http://localhost:3000', {
                'force new connection': true
            });
            socket.on('error', function(err) {
                err.should.eql('handshake unauthorized');
                done();
            });
        });

    });

    describe('when the user is logged in', function() {

        beforeEach(function(done) {
            request.post({
                jar: this.cookies,
                url: 'http://localhost:3000/login',
                form: {
                    username: 'user1',
                    password: '1111aaaa'
                }
            }, done);
        });

        it('should do the handshake and connect', function(done) {
            var socket = io.connect('http://localhost:3000', {
                'force new connection': true
            });
            socket.on('connect', function() {
                done();
            }).on('error', done);
        });

    });

});