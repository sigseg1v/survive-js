"use strict";
var limit = require('../../etc/ratelimiter.js');

function PlayerSyncClient(container, socket, game) {
    var player = null;

    game.events.once('playerLoaded', function(ent) {
        player = ent;

        // ignore automatic sync updates to players position since it's handled here
        player.components.placement.ignoreUpdates = true;
        player.components.movable.ignoreUpdates = true;

        socket.on('forcePlayerPosition', function (data) {
            player.components.placement.position = data.position;
        });
    });

    var sendPlayerData_limit = limit(1000/10, sendPlayerData);
    this.step = function step() {
        sendPlayerData_limit();
    };

    function sendPlayerData() {
        if (player && player.components.movable && player.components.placement) {
            socket.emit('playerAction', {
                position: player.components.placement.position,
                velocity: player.components.movable.velocity,
                orientation: player.components.placement.orientation
            });
        }
    }
}

module.exports = PlayerSyncClient;
module.exports.$inject = ['$container', 'socket', 'Game'];
