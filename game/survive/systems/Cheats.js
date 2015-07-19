"use strict";

var isServer = typeof window === 'undefined';

function Cheats(game, tuning) {
    game.events.on('chat-receive', function (payload) {
        if (isServer) {
            if (!payload.message || payload.message[0] !== '/') {
                return;
            }
            var components = payload.message.split(' ');
            if (components.length === 0) {
                return;
            }
            switch (components[0]) {
                case '/next':
                    game.events.emit('cheat:advanceStage');
                    break;
                case '/set':
                    if (components.length === 3) {
                        if (tuning.hasOwnProperty(components[1])) {
                            tuning[components[1]] = components[2];
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    });

    this.step = function step() {
    };
}

module.exports = Cheats;
module.exports.$inject = [ 'Game', 'Tuning' ];
