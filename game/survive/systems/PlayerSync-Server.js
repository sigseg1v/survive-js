"use strict";

function PlayerSyncServer(container, game, physics) {

    game.events.on('userConnected', function (data) {
        var player = data.player;
        var socket = data.socket;

        function onPlayerAction(action) {
            //if (player.components.movable.canMove) {
            if (action.position) {
                // TODO: there is currently nothing preventing a player from teleport hacking
                player.components.placement.position = action.position;
            }
            if (action.velocity) {
                player.components.movable.velocity = action.velocity;
            }
            //}
            if (action.orientation !== null && action.orientation !== undefined) {
                player.components.placement.orientation = action.orientation;
            }
        }

        socket.on('playerAction', function (data) {
            onPlayerAction(data);
        });
    });

    this.step = function step() {
    };
}

module.exports = PlayerSyncServer;
module.exports.$inject = ['$container', 'Game', 'lib/physicsjs'];
