"use strict";
var isServer = typeof window === 'undefined';
var limit = require('../../etc/ratelimiter.js');

function NetworkPingClient(socket, game) {
    var pingServer_limit = limit(500, pingServer);

    var player = null;
    game.events.on('playerLoaded', function (ent) { player = ent; });

    var pingData = {
        fromServer: 0,
        rtt: 0,
        count: 0
    };
    socket.on('pong', function (data) {
        pingData.fromServer = updateMovingAverage(Number(new Date()) - data.timestamp, pingData.fromServer, pingData.count);
        pingData.rtt = updateMovingAverage(Number(new Date()) - data.original, pingData.rtt, pingData.count);
        if (pingData.count < 10) {
            pingData.count++;
        }

        game.events.emit('rttPingUpdate', pingData.rtt);

        // @ifdef TRACE
        var tracelogger = player && player.components.tracelog;
        if (tracelogger) {
            tracelogger.persistent.ping = 'ping: ' + pingData.fromServer.toFixed(1) + ' ms server, ' + pingData.rtt.toFixed(1) + ' ms rtt';
        }
        // @endif
    });

    this.step = function step() {
        pingServer_limit();
    };

    function pingServer() {
        socket.emit('ping', Number(new Date()));
    }
}
NetworkPingClient.$inject = ['socket', 'Game' ];

function NetworkPingServer(game) {
    var pingTable = {};
    game.events.on('userConnected', function (data) {
        var player = data.player;
        var socket = data.socket;
        var pingData = {
            average: 0,
            count: 0
        };
        pingTable[socket.id] = pingData;

        socket.on('ping', function (time) {
            pingData.average = updateMovingAverage(Number(new Date()) - time, pingData.average, pingData.count);
            if (pingData.count < 10) {
                pingData.count++;
            }

            socket.emit('pong', { timestamp: Number(new Date()), original: time });
        });
    });
    this.step = function step() {
    };
}
NetworkPingServer.$inject = ['Game'];

function updateMovingAverage(newValue, oldAverage, oldCount) {
    return ( newValue + (oldCount * oldAverage) ) / (oldCount + 1);
}

module.exports = isServer ? NetworkPingServer : NetworkPingClient;
