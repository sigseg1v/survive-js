'use strict';

var container = require('./game/inversion/container.js');
var express = require('express');
var app = express();
var port = 3000;
var server = app.listen(port);
var io = require('socket.io')(server);
container.registerAlias('socket', io);

// var rpcApp = express();
// var rpcPort = 3001;
// var rpcServer = rpcApp.listen(rpcPort);
// var rpcIo = require('socket.io')(rpcServer);
var rpc = require('socket.io-rpc')(io, app);
container.registerAlias('serverRpc', rpc);

var gameServer = require('./game/survive/game/Server.js');

process.on('uncaughtException', function (exception) {
    if (exception && exception.stack) {
        console.log(exception.stack);
    } else {
        console.log(exception);
    }
});

app.configure(function () {
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views/out');
    app.use(express.compress());
    app.use(express.static(__dirname + '/assets'));
    app.use(express.json());
    app.use(express.urlencoded());
});

// rpcApp.configure(function() {
//     app.use(express.compress());
//     app.use(express.json());
//     app.use(express.urlencoded());
// });

app.get('/', function(request, response, next) {
    response.render('index');
});
app.get('/game', function(request, response, next) {
    response.render('game');
});
app.get('/login', function(request, response, next) {
    response.render('login');
});

gameServer.start();

console.log('Express started on port ' + port);
