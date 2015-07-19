"use strict";
var weakmap = require('weakmap');
var bodies = require('../content/bodies.js');
var limit = require('../../etc/ratelimiter.js');

var playerEntityList = new weakmap();
function trackEntityUnderPlayer(player, entity) {
    if (!playerEntityList.has(player)) {
        playerEntityList.set(player, []);
    }
    playerEntityList.get(player).push(entity);
}
function removeEntityUnderPlayer(player, entity) {
    if (playerEntityList.has(player)) {
        var list = playerEntityList.get(player);
        var index = list.indexOf(entity);
        if (index !== -1) {
            list.splice(index, 1);
        }
    }
}

function PlayerData() {
    this.buildMenuEntity = null;
}

var playerDataMap = new weakmap();
function dataFor(player) {
    if (!playerDataMap.has(player)) {
        playerDataMap.set(player, new PlayerData());
    }
    return playerDataMap.get(player);
}

function ServerActions(container, game, world, Server, socket, physics, pathfinder, tuning) {
    var self = this;

    var collisionDetector = physics.behavior('body-collision-detection');

    self.getPlayerChildEntities = function getPlayerChildEntities(player) {
        return playerEntityList.has(player) ? playerEntityList.get(player) : [];
    };

    self.exposedActions = {
        notifyIdentifier: function notifyIdentifier(identifier) {
            this.commonId = identifier;
        },

        spawnEnemy: function spawnEnemy() {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var enemy = container.resolve('entity/EnemyEntity/slime');
            enemy.components.placement.position = player.components.placement.position;
            world.addEntity(enemy);
        },

        sendChatMessage: function sendChatMessage(message) {
            message = (message === undefined || message === null) ? '' : message;
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var playerName = player.components.name.name;
            var chatPayload = {
                user: playerName,
                message: message
            };
            game.events.emit('chat-receive', chatPayload);
            socket.emit('chat-message', chatPayload);
        }
    };
}

module.exports = ServerActions;
module.exports.$inject = ['$container', 'Game', 'World', 'Server', 'socket', 'lib/physicsjs', 'Pathfinder', 'Tuning'];
