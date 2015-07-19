"use strict";

var rpc = null;

function ClientActions(container, game, world, socket, rpcClientPromise, pixi) {
    var self = this;

    var rpc = null;

    var load = rpcClientPromise.then(function (rpcClient) {
        return rpcClient.loadChannel('player-actions').then(function (actions) {
            console.log('rpc channel connected');
            rpc = actions;

            actions.notifyIdentifier(socket.id);
            return actions;
        }, function (err) {
            if (err) {
                console.log(err);
            }
        });
    });

    var requestingBuildMenu = false;
    self.toggleBuildMenu = function toggleBuildMenu() {
        if (!rpc || requestingBuildMenu) {
            return;
        }
        requestingBuildMenu = true;
        rpc.toggleBuildMenu().then(function (menu) {
            requestingBuildMenu = false;
            if (menu) {
                // opened
                game.events.emit('buildmenu-open', menu);
            } else {
                // closed
                game.events.emit('buildmenu-close');
            }
        });
    };

    self.createBuilding = function createBuilding(name) {
        if (!rpc) {
            return;
        }

        rpc.createBuilding(name);
    };

    self.consumeNearby = function consumeNearby() {
        if (!rpc) {
            return;
        }
        rpc.consumeNearby();
    };

    self.spawnEnemy = function spawnEnemy() {
        if (!rpc) {
            return;
        }
        rpc.spawnEnemy();
    };

    // self.pathEnemiesToPlayer = function pathEnemiesToPlayer() {
    //     if (!rpc) {
    //         return;
    //     }
    //     rpc.pathEnemiesToPlayer();
    // };

    self.getDayNightStatus = function getDayNightStatus() {
        return load.then(function (rpc) { return rpc.getDayNightStatus(); });
    };

    self.sendChatMessage = function sendChatMessage(message) {
        if (!rpc) {
            return;
        }
        rpc.sendChatMessage(message);
    };
}

module.exports = ClientActions;
module.exports.$inject = ['$container', 'Game', 'World', 'socket', 'rpcClient', 'lib/pixi.js'];
