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

function ServerActions(container, game, world, Server, socket, physics, Hex, pathfinder, tuning) {
    var self = this;

    var collisionDetector = physics.behavior('body-collision-detection');

    function useSingleNearby(entity, query) {
        var entBody = entity.components.movable.body;
        if (!entBody) return 'unavailable';
        var useCircle = bodies(physics, 'UseCircle');
        useCircle.state.pos.clone(entBody.state.pos);
        var useCircleAabb = useCircle.aabb();
        var targetEnt = null;
        var potentialTargets = world.physics.find(query).some(function (body) {
            if(physics.aabb.overlap(useCircleAabb, body.aabb()) && !!collisionDetector.checkGJK(body, useCircle)) {
                targetEnt = body.entity();
                return true;
            }
            return false;
        });
        if (targetEnt) {
            var miner = entity.components.miner;
            var resource = targetEnt.components.resource;
            var amount = Math.min((resource.type === container.resolve('component/Resource').ResourceType.ROCK) ? 1 : miner.rate, resource.amount);
            miner.addResource(resource.type, amount);
            resource.amount -= amount;

            var useMessage = {
                targetEntityId: targetEnt.id
            };

            if (resource.type === container.resolve('component/Resource').ResourceType.ROCK) {
                socket.emit('rockAttacked', useMessage);
            }

            if (resource.amount <= 0) {
                world.removeEntity(targetEnt);
            }

            return useMessage;
        }
        return 'no-targets-found';
    }

    self.getPlayerChildEntities = function getPlayerChildEntities(player) {
        return playerEntityList.has(player) ? playerEntityList.get(player) : [];
    };

    self.exposedActions = {
        notifyIdentifier: function notifyIdentifier(identifier) {
            this.commonId = identifier;
        },

        getDayNightStatus: function getDayNightStatus() {
            var dayNight = container.resolve('system/DayNightCycle');
            return dayNight.getState();
        },

        toggleBuildMenu: function toggleBuildMenu() {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var playerData = dataFor(player);
            if (!playerData.buildMenuEntity) {
                // open build menu
                var buildMenuEnt = container.resolve('entity/BuildingMarkerEntity/buildingMarker');
                buildMenuEnt.components.placement.position.x = player.components.placement.position.x;
                buildMenuEnt.components.placement.position.y = player.components.placement.position.y;
                buildMenuEnt.components.follow.targetId = player.id;
                world.addEntity(buildMenuEnt);
                trackEntityUnderPlayer(player, buildMenuEnt);

                playerData.buildMenuEntity = buildMenuEnt;

                var menu = [
                    {
                        name: 'Base',
                        cost: [0, 0, 0, 0].map(function (val) { return val * tuning.buildingCostMultiplier; })
                    },
                    {
                        name: 'Generator',
                        cost: [25, 0, 0, 0].map(function (val) { return val * tuning.buildingCostMultiplier; })
                    },
                    {
                        name: 'Healer',
                        cost: [0, 25, 0, 0].map(function (val) { return val * tuning.buildingCostMultiplier; })
                    },
                    {
                        name: 'Cannon',
                        cost: [0, 0, 0, 25].map(function (val) { return val * tuning.buildingCostMultiplier; })
                    },
                    {
                        name: 'Wall',
                        cost: [0, 0, 15, 0].map(function (val) { return val * tuning.buildingCostMultiplier; })
                    }
                ];

                return menu;
            } else {
                // close build menu
                removeEntityUnderPlayer(player, playerData.buildMenuEntity);
                world.removeEntity(playerData.buildMenuEntity);

                playerData.buildMenuEntity = null;
            }
        },

        createBuilding: function createBuilding(name) {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;

            var entType;
            var resourceType;
            var cost; // TODO -- fix hardcoded costs. Can use values coming from same place as ToggleBuildMenu
            var miner = player.components.miner;
            var types = container.resolve('component/Resource').ResourceType;
            var dayNight = container.resolve('system/DayNightCycle');
            if (name === 'Base' && dayNight.getState().mode === 'not-started' && !dayNight.getState().completed) {
                cost = 0 * tuning.buildingCostMultiplier;
                entType = 'entity/BaseEntity/base';
                resourceType = types.BLUE;
            } else if (name === 'Generator') {
                cost = 25 * tuning.buildingCostMultiplier;
                entType = 'entity/GeneratorEntity/generator';
                resourceType = types.RED;
            } else if (name === 'Healer') {
                cost = 25 * tuning.buildingCostMultiplier;
                entType = 'entity/HealerEntity/healer';
                resourceType = types.GREEN;
            } else if (name === 'Cannon') {
                cost = 25 * tuning.buildingCostMultiplier;
                entType = 'entity/CannonEntity/cannon';
                resourceType = types.PURPLE;
            } else if (name === 'Wall') {
                cost = 15 * tuning.buildingCostMultiplier;
                entType = 'entity/TankEntity/tank';
                resourceType = types.BLUE;
            } else {
                return;
            }
            var amountAvailable = miner.getResource(resourceType);
            if (amountAvailable < cost) {
                return;
            }

            var playerData = dataFor(player);
            if (playerData.buildMenuEntity) {
                var buildMenuBody = bodies(physics, 'Wall');
                buildMenuBody.state.pos.clone(playerData.buildMenuEntity.components.placement.position);
                var buildMenuAABB = buildMenuBody.aabb();


                var buildingPlacementBlocked =
                world.physics.findOne({
                    labels: { $in: ['building', 'wall'] },
                    $at: playerData.buildMenuEntity.components.placement.position // point check is fine here
                }) || world.physics.find({
                    labels: { $nin: ['building', 'wall'] }
                }).some(function (body) {
                    // for entities that aren't buildings on the hex grid, we need to do full collision detection
                    return physics.aabb.overlap(buildMenuAABB, body.aabb()) && !!collisionDetector.checkGJK(body, buildMenuBody);
                });

                if (!buildingPlacementBlocked) {
                    var base = world.physics.findOne({
                        labels: { $in: ['base'] }
                    });
                    var pathExists = base && (pathfinder.findPath({
                        start: { x: 0, y: 0 },
                        end: base.state.pos,
                        alwaysCollideWithHexAt: buildMenuBody.state.pos,
                        skipCache: true
                    }) !== null);

                    if (pathExists || (!base && name === 'Base')) {
                        var ent = container.resolve(entType);
                        ent.components.placement.position = playerData.buildMenuEntity.components.placement.position;
                        var light = container.resolve('component/Lightsource');
                        ent.addComponent(light);
                        world.addEntity(ent);
                        trackEntityUnderPlayer(player, ent);

                        miner.setResource(resourceType, amountAvailable - cost);
                    }
                }
            }
        },

        consumeNearby: function consumeNearby() {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            // var playerData = dataFor(player);
            var res = limit.byCooldown(player.components.use, useSingleNearby.bind(null, player, {
                labels: { $in: ['destroyable'] }
            }));
            if (res !== null) {
                game.events.emit('useSuccess', res);
                return res;
            } else {
                return 'cooldown';
            }
        },

        spawnEnemy: function spawnEnemy() {
            var player = Server.getPlayerBySocketId(this.commonId);
            if (!player) return;
            var enemy = container.resolve('entity/EnemyEntity/slime');
            enemy.components.placement.position = player.components.placement.position;
            world.addEntity(enemy);
        },

        // pathEnemiesToPlayer: function pathEnemiesToPlayer() {
        //     var player = Server.getPlayerBySocketId(this.commonId);
        //     if (!player) return;
        //     var enemies = world.physics.find({
        //         labels: { $in: ['enemy'] }
        //     });
        //     enemies.forEach(function (enemyBody) {
        //         // TODO -- cache; this is going to be extremely slow to do for each enemy
        //         var pathComp = enemyBody.entity().components.path;
        //         pathComp.currentWaypoint = null;
        //         pathComp.path = pathfinder.findPath({
        //             start: enemyBody.state.pos,
        //             end: player.components.placement.position,
        //             wallsOnly: true
        //         });
        //     });
        // },

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
module.exports.$inject = ['$container', 'Game', 'World', 'Server', 'socket', 'lib/physicsjs', 'Hex', 'Pathfinder', 'Tuning'];
