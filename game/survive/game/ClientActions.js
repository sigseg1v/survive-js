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

    self.spawnEnemy = function spawnEnemy() {
        if (!rpc) {
            return;
        }
        rpc.spawnEnemy();
    };

    self.attack = function attack(targetPoint, weapon) {
        if (!rpc) {
            return;
        }
        rpc.attack(targetPoint, weapon);
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
