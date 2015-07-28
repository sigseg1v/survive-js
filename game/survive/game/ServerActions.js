"use strict";
var weakmap = require('weakmap');
var bodies = require('game/survive/content/bodies');
var limit = require('game/etc/ratelimiter');

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

function ServerActions(container, game, world, Server, socket, physics, pathfinder, tuning, clientStateManager, constants) {
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

    self.getPlayerChildEntities = function getPlayerChildEntities(player) {
        return playerEntityList.has(player) ? playerEntityList.get(player) : [];
    };

/// @section: melee attack
    var attackHandler = limit.responsive()
        .on('ready', onAttackReady)
        .on('gcd', onAttackGcd)
        .on('cooldown', onAttackCooldown);

    function onAttackReady(limiter, state, player, client, targetPoint, weapon) {
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
                if (ent && ent.components.movable && ent.components.movable.body) {
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

        var damage = player.components.melee.damage * weapon.damageMultiplier;
        socket.emit('entity-attack', {
            entityId: player.id,
            targetPoint: targetPoint,
            weapon: weapon.id
        });

        if (hit.length === 0) {
            limiter.clearReadyCooldown(state);
        }

        hit.forEach(function (ent) {
            var amount = Math.min(ent.components.health.currentHealth, damage);
            if (amount < 0) {
                return;
            }
            socket.emit('entity-damaged', {
                entityId: ent.id,
                amount: amount
            });
            ent.components.health.currentHealth -= amount;
            if (ent.components.health.currentHealth <= 0) {
                world.removeEntity(ent);
            }
        });
        scratch.done();
    }

    function onAttackGcd(limiter, state, player, client, targetPoint, weapon) { }

    function onAttackCooldown(limiter, state, player, client, targetPoint, weapon) { }
/// @end: melee attack

/// @section: ranged attack
    var rangedAttackHandler = limit.responsive()
        .on('ready', onRangedAttackReady)
        .on('cooldown', onRangedAttackCooldown);

    function rangedAttackCollide(lineStart, lineVector, circle) {
        var scratch = physics.scratchpad();
        var startToCircleCenter = scratch.vector().clone(circle.state.pos).vsub(lineStart);
        var projOntoLine = scratch.vector().clone(startToCircleCenter).vproj(lineVector);
        var dist = projOntoLine.dist(startToCircleCenter);
        return scratch.done( dist <= circle.radius && ((projOntoLine.angle() > 0) === (lineVector.angle() > 0)) );
    }

    function onRangedAttackReady(limiter, state, player, client, targetPoint, weapon) {
        var scratch = physics.scratchpad();

        var attackStartPos = player.components.movable.body.state.pos;
        var attackDirection = scratch.vector().clone(targetPoint).vsub(attackStartPos).normalize();
        var attackRange = weapon.range;
        var attackLineVector = scratch.vector().clone(attackDirection).mult(attackRange);

        var candidates = [];
        var loadedChunks = client.getLoadedChunks();
        loadedChunks.forEach(function (chunk) {
            var i, ilen, ent;
            var entIds = chunk.getEntityIds();
            for (i = 0, ilen = entIds.length; i < ilen; i++) {
                ent = world.entityById([entIds[i]]);
                if (ent && ent.components.movable && ent.components.movable.body) {
                    candidates.push(ent.components.movable.body);
                }
            }
        });

        var hit = world.physics.find({
            labels: { $in: ['enemy'] },
            $in: candidates
        }).filter(function (body) {
            // only supports circles for now
            return ('radius' in body) && rangedAttackCollide(attackStartPos, attackLineVector, body);
        }).map(function (body) {
            return body.entity();
        }).filter(function (ent) {
            return ent && ent.components.health;
        });

        var damage = player.components.rangedAttack.damage * weapon.damageMultiplier;
        socket.emit('entity-attack', {
            entityId: player.id,
            targetPoint: attackLineVector,
            weapon: weapon.id
        });

        hit.forEach(function (ent) {
            var amount = Math.min(ent.components.health.currentHealth, damage);
            if (amount < 0) {
                return;
            }
            socket.emit('entity-damaged', {
                entityId: ent.id,
                amount: amount
            });
            ent.components.health.currentHealth -= amount;
            if (ent.components.health.currentHealth <= 0) {
                world.removeEntity(ent);
            }
        });
        scratch.done();
    }

    function onRangedAttackCooldown(limiter, state, player, client, targetPoint, weapon) { }
/// @end: ranged attack

    self.exposedActions = {
        notifyIdentifier: function notifyIdentifier(identifier) {
            this.commonId = identifier;
        },

        spawnEnemy: function spawnEnemy() {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            spawnEnemyAtLocation(player.components.placement.position);
        },

        attack: function attack(targetPoint, weaponId) {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var client = clientStateManager.getClientStateBySocketId(this.commonId);

            if (weaponId === constants.weapons.MELEE.id) {
                attackHandler.trigger(player.components.melee, [player, client, targetPoint, constants.weapons.MELEE]);
            } else if (weaponId === constants.weapons.RIFLE.id) {
                rangedAttackHandler.trigger(player.components.rangedAttack, [player, client, targetPoint, constants.weapons.RIFLE]);
            }
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
module.exports.$inject = ['$container', 'Game', 'World', 'Server', 'socket', 'lib/physicsjs', 'Pathfinder', 'Tuning', 'ClientStateManager', 'Constants'];
