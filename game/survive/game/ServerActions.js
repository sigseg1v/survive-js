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

function ServerActions(container, game, world, Server, socket, physics, pathfinder, tuning, clientStateManager) {
    var self = this;

    var collisionDetector = physics.behavior('body-collision-detection');
    var pool = {
        attackArc1: bodies(physics, 'AttackArc1')
    };

    function spawnEnemyAtLocation(location) {
        var enemy = container.resolve('entity/EnemyEntity/slime');
        enemy.components.placement.position = location;
        world.addEntity(enemy);
    }

    function performAttack(player, client, targetPoint, weapon) {
        var scratch = physics.scratchpad();
        var attackArc = pool.attackArc1;
        attackArc.state.pos.clone(player.components.movable.body.state.pos);
        var angle = scratch.vector().clone(targetPoint).vsub(player.components.movable.body.state.pos).angle();
        //spawnEnemyAtLocation(scratch.vector().clone(targetPoint).vsub(player.components.movable.body.state.pos).normalize().mult(1).vadd(player.components.movable.body.state.pos));
        attackArc.state.angular.pos = angle;
        var attackArcAabb = attackArc.aabb();

        var candidates = [];
        var loadedChunks = client.getLoadedChunks();
        loadedChunks.forEach(function (chunk) {
            var i, ilen, ent;
            var entIds = chunk.getEntityIds();
            for (i = 0, ilen = entIds.length; i < ilen; i++) {
                ent = world.entityById([entIds[i]]);
                if (ent && ent.components.movable.body) {
                    candidates.push(ent.components.movable.body);
                }
            }
        });

        var hit = world.physics.find({
            labels: { $in: ['enemy'] },
            $in: candidates
        }).filter(function (body) {
            return physics.aabb.overlap(attackArcAabb, body.aabb()) && !!collisionDetector.checkGJK(body, attackArc);
        }).map(function (body) {
            return body.entity();
        }).filter(function (ent) {
            return ent && ent.components.health;
        });

        var damage = player.components.melee.damage;
        hit.forEach(function (ent) {
            var amount = Math.min(ent.components.health.currentHealth, damage);
            ent.components.health.currentHealth -= amount;
            if (ent.components.health.currentHealth <= 0) {
                world.removeEntity(ent);
            }
        });
        scratch.done();
    }

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
            spawnEnemyAtLocation(player.components.placement.position);
        },

        attack: function attack(targetPoint, weapon) {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var client = clientStateManager.getClientStateBySocketId(this.commonId);
            limit.byCooldown(player.components.melee, performAttack, [player, client, targetPoint, weapon]);
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
module.exports.$inject = ['$container', 'Game', 'World', 'Server', 'socket', 'lib/physicsjs', 'Pathfinder', 'Tuning', 'ClientStateManager'];
