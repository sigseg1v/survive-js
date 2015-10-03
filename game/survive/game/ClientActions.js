"use strict";

var Promise = require('bluebird');

var rpc = null;

function ClientActions(container, physics, game, world, socket, rpcClientPromise, pixi, playerState) {
    var self = this;

    var rpc = null;

    var player = null;
    game.events.on('playerLoaded', function (ent) { player = ent; });

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

    self.selectWeapon = function selectWeapon(id) {
        if (!rpc) {
            return;
        }
        rpc.selectWeapon(id);
    };

    self.attack = function attack(targetPoint, onStart, onComplete, onCancel) {
        if (!rpc || !player) {
            return null;
        }
        var startTime = Number(new Date());

        var promise = rpc.attack(targetPoint);
        promise.then(function (action) {
            if (action === null) {
                player.components.movable.canMove = true;
                onCancel();
            }
        });
        promise.error(function () {
            player.components.movable.canMove = true;
            onCancel();
        });

        player.components.movable.canMove = false;
        player.components.movable.velocity = physics.vector.zero;
        onStart();

        return {
            response: promise,
            started: startTime,
            complete: function (data) {
                promise.then(function (action) {
                    if (action === null) return;
                    if (Number(new Date()) >= (startTime + action.castTime)) {
                        self.completeAction(action.actionId, data);
                    } else {
                        self.cancelAction(action.actionId, data);
                    }
                });
                player.components.movable.canMove = true;
                onComplete();
            },
            cancel: function () {
                promise.then(function (action) {
                    if (action === null) return;
                    self.cancelAction(action.actionId);
                });
                player.components.movable.canMove = true;
                onCancel();
            }
        };
    };

    self.completeAction = function completeAction(actionIdentifier, data) {
        if (!rpc) {
            return;
        }
        rpc.completeAction(actionIdentifier, data);
    };

    self.cancelAction = function cancelAction(actionIdentifier, data) {
        if (!rpc) {
            return;
        }
        rpc.cancelAction(actionIdentifier, data);
    };

    self.sendChatMessage = function sendChatMessage(message) {
        if (!rpc) {
            return;
        }
        rpc.sendChatMessage(message);
    };
}

module.exports = ClientActions;
module.exports.$inject = ['$container', 'lib/physicsjs', 'Game', 'World', 'socket', 'rpcClient', 'lib/pixi.js', 'PlayerState'];
