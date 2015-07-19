"use strict";
var limit = require('../../etc/ratelimiter.js');
var bodies = require('../content/bodies.js');

function ResourceAutoGatherCycle(container, game, server, physics, socket, world, clientStateManager, Resource, effects) {
    var gatherCircle = bodies(physics, 'GatherCircle');
    var collisionDetector = physics.behavior('body-collision-detection');

    var mode = container.resolve('system/DayNightCycle').getState().mode;
    game.events.on('dayNightCycle:any', function (state) {
        mode = state.mode;
    });

    this.step = function step(time) {
        // TODO -- it will be slow to do this every iteration
        var dayNight = container.resolve('system/DayNightCycle');
        if (mode === 'not-started') {
            return;
        }
        var potentialTargets = world.physics.find({
            labels: { $in: ['resource'] }
        });
        clientStateManager.getAllPlayers().forEach(function (player) {
            autoGather(player, potentialTargets);
        });
    };

    function autoGather(player, potentialTargets) {
        if (!player) return;
        limit.byCooldown(player.components.miner, gatherResource.bind(null, player, potentialTargets));
    }

    function gatherResource(entity, potentialTargets) {
        var entBody = entity.components.movable.body;
        if (!entBody) return null;
        gatherCircle.state.pos.clone(entBody.state.pos);
        var gatherCircleAabb = gatherCircle.aabb();
        var targets = potentialTargets.filter(function (body) {
            return (physics.aabb.overlap(gatherCircleAabb, body.aabb()) && !!collisionDetector.checkGJK(body, gatherCircle));
        });
        var miner = entity.components.miner;
        if (targets.length > 0) {
            var scaledRate = miner.rate / targets.length;
            var gatherMessage = {
                resources: [],
                targetEntityId: entity.id
            };
            targets.forEach(function (targetBody) {
                var targetEnt = targetBody.entity();
                var resource = targetEnt.components.resource;
                var amount = Math.min(scaledRate, resource.amount);
                miner.addResource(resource.type, amount);
                resource.amount -= amount;

                gatherMessage.resources.push({
                    type: resource.type,
                    amount: amount,
                    sourceEntityId: targetEnt.id
                });

                if (resource.amount <= 0) {
                    world.removeEntity(targetEnt);
                }
            });
            game.events.emit('resourceGathered', gatherMessage);
            socket.emit('resourceGathered', gatherMessage);
        }
    }
}

module.exports = ResourceAutoGatherCycle;
module.exports.$inject = ['$container', 'Game', 'Server', 'lib/physicsjs', 'socket', 'World', 'ClientStateManager', 'component/Resource', 'system/Effects'];
