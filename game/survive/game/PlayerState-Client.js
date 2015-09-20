"use strict";
function PlayerStateClient(container, socket, game) {
    var self = this;

    var stateInternal = null;

    socket.on('playerState:update', function (data) {
        stateInternal = data;
        game.events.emit('playerState:update', stateInternal);
    });

    Object.defineProperty(self, 'state', {
        get: function () {
            return stateInternal;
        }
    });
}

module.exports = PlayerStateClient;
module.exports.$inject = ['$container', 'socket', 'Game'];
