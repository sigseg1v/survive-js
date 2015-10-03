"use strict";
var bodies = require('game/survive/content/bodies');
var limit = require('game/etc/ratelimiter');
var constants = require('game/survive/game/SharedConstants');

function ServerActions(container, game, world, Server, socket, physics, pathfinder, tuning, clientStateManager, playerStateManager) {
    var self = this;

    var collisionDetector = physics.behavior('body-collision-detection');
    var pool = {
        attackArc1: bodies(physics, 'AttackArc1').hitbox
    };

    function spawnEnemyAtLocation(location) {
        var enemy = container.resolve('entity/EnemyEntity/slime');
        enemy.components.placement.position = location;
        world.addEntity(enemy);
    }

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
                if (ent && ent.components.movable && ent.labels.indexOf('enemy') !== -1) {
                    candidates.push(ent.components.movable.hitbox || ent.components.movable.body);
                }
            }
        });
        var hit = candidates.filter(function (body) {
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

    function rangedAttackCircleBodyCollide(lineStart, lineVector, circle) {
        var scratch = physics.scratchpad();
        var startToCircleCenter = scratch.vector().clone(circle.state.pos).vsub(lineStart);
        var projOntoLine = scratch.vector().clone(startToCircleCenter).vproj(lineVector);

        return scratch.done(
            (projOntoLine.dist(startToCircleCenter) <= circle.radius) // ray intersects circle
            && ((projOntoLine.angle() > 0) === (lineVector.angle() > 0)) // correct direction
            && (lineVector.norm() >= projOntoLine.norm()) // range is long enough to reach intersection point
        );
    }

    function getRangedAttackLineSegmentBody(lineStart, lineVector) {
        var length = lineVector.norm();
        var halfWidth = 0.05;
        var body = physics.body('convex-polygon', {
            x: lineStart.x,
            y: lineStart.y,
            offset: new physics.vector(length * 0.5, 0), // offset by center of mass (will be exactly in the middle of the line)
            vertices: [
                { x:  0.0,      y: -halfWidth },
                { x:  length,   y: -halfWidth },
                { x:  length,   y:  halfWidth },
                { x:  0.0,      y:  halfWidth },
            ],
            treatment: 'static'
        });
        body.state.angular.pos = lineVector.angle();
        return body;
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
                if (ent && ent.components.movable && ent.labels.indexOf('enemy') !== -1) {
                    candidates.push(ent.components.movable.hitbox || ent.components.movable.body);
                }
            }
        });

        var lineSegmentCollisionBody = getRangedAttackLineSegmentBody(attackStartPos, attackLineVector);
        var lineSegmentCollisionBodyAabb = lineSegmentCollisionBody.aabb();

        var hit = candidates.filter(function (body) {
            if ('radius' in body) {
                // line segment <-> circle collision is fast, so use it if we can
                return rangedAttackCircleBodyCollide(attackStartPos, attackLineVector, body);
            } else {
                // otherwise, we need to use something like bounding box -> GJK
                return physics.aabb.overlap(lineSegmentCollisionBodyAabb, body.aabb()) && !!collisionDetector.checkGJK(body, lineSegmentCollisionBody);
            }
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

        selectWeapon: function selectWeapon(id) {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;

            playerStateManager.cancelPendingActions(player);

            if (Object.keys(constants.weapons).some(function (k) {
                return constants.weapons[k].id === id;
            })) {
                var playerData = playerStateManager.dataFor(player);
                playerData.weapon = id;
                playerStateManager.sendDataTo(player);
            }
        },

        attack: function attack(targetPoint) {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var client = clientStateManager.getClientStateBySocketId(this.commonId);
            var playerData = playerStateManager.dataFor(player);

            // cancel anything in progress
            playerStateManager.cancelPendingActions(player);

            var weaponId = playerData.weapon;
            var check = null;
            var returnValue = null;

            switch (weaponId) {
                case constants.weapons.MELEE.id:
                    attackHandler.trigger(player.components.melee, [player, client, targetPoint, constants.weapons.MELEE]);
                    break;
                case constants.weapons.RIFLE.id:
                    check = rangedAttackHandler.check(player.components.rangedAttack, [player, client, targetPoint, constants.weapons.RIFLE]);
                    if (check.event === 'ready') {
                        var action = playerStateManager.startAction(
                            player,
                            function startCast() {
                                player.components.movable.canMove = false;
                                player.components.movable.velocity = physics.vector.zero;
                            },
                            function finishCast() {
                                check.trigger();
                                player.components.movable.canMove = true;
                            },
                            function cancelCast() {
                                player.components.movable.canMove = true;
                            },
                            constants.weapons.RIFLE.castTime);
                        returnValue = {
                            actionId: action.uniqueId,
                            castTime: constants.weapons.RIFLE.castTime
                        };
                    } else {
                        check.trigger();
                    }
                    break;
            }
            return returnValue;
        },

        completeAction: function completeAction(actionIdentifier) {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var action = playerStateManager.findActionById(player, actionIdentifier);
            if (!action) return;
            action.complete();
        },

        cancelAction: function cancelAction(actionIdentifier) {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var action = playerStateManager.findActionById(player, actionIdentifier);
            if (!action) return;
            action.cancel();
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
module.exports.$inject = ['$container', 'Game', 'World', 'Server', 'socket', 'lib/physicsjs', 'Pathfinder', 'Tuning', 'ClientStateManager', 'PlayerState'];
