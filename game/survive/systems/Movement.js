"use strict";
var isServer = typeof window === 'undefined';
var limit = require('../../etc/ratelimiter.js');
var movingAverage = require('moving-average');

function Movement(container, Hex, Entity, Movable, Placement, Follow, world, physics) {
    var MAX_REPLAY_STATE_QUEUE_LEN = 5; // TODO -- consolidate shared constants
    var TARGET_AMOUNT_REPLAY_STATES = 1;

    var hexScratch = new Hex(0, 0, 1);
    var vectorScratch = new physics.vector();

    var limit_updateReplayDelay = limit(3000, updateReplayDelay);
    var avg_replayStateCount = movingAverage(5 * 60 * 1000);

    this.step = function step(time) {

        // @ifdef TRACE
        Movable.forWith([Placement.name], function (entity) {
            if (entity.components.movable.body.treatment === 'static') {
                return;
            }
            var tracelogger = entity.components.tracelog;
            if (tracelogger) {
                tracelogger.persistent[Movable.name] = 'position ' + entity.components.placement.position.toFixedString(5) + ', velocity ' + entity.components.movable.body.state.vel.toFixedString(5) + ', accel ' + entity.components.movable.body.state.acc.toFixedString(5);
                tracelogger.persistent[Movable.name + '_1'] = 'replay states : ' + entity.components.movable.body.replayStateCount();
            }
        });
        // @endif

        if (!isServer) {
            limit_updateReplayDelay();
        }

        world.physics.step(time.absoluteTotal);

        Follow.forWith([Placement.name], function (entity) {
            var targetId = entity.components.follow.targetId;
            if (!targetId) {
                return;
            }
            var target = world.entityById(targetId);
            if (!target || !target.components.placement) {
                return;
            }
            var snap = entity.components.follow.snap;
            if (entity.components.movable)  {
                // TODO -- move towards using physics
            } else {
                vectorScratch.clone(entity.components.follow.offset).negate();
                vectorScratch.rotate(target.components.placement.orientation);
                entity.components.placement.position.clone(target.components.placement.position).vsub(vectorScratch);
                if (snap === 'hex') {
                    hexScratch.setValuesByCartesian(entity.components.placement.position.x, entity.components.placement.position.y, 1);
                    entity.components.placement.position.set(hexScratch.getX(), hexScratch.getY());
                }
            }
        });
    };

    function updateReplayDelay() {
        var enemies = world.physics.find({
            labels: { $in: ['enemy'] }
        });
        if (enemies.length === 0) {
            return;
        }

        var modeReplayStateCount = calculateModeReplayStateCount(enemies);
        avg_replayStateCount.push(Date.now(), modeReplayStateCount);
        var average = avg_replayStateCount.movingAverage();
        var currentReplayDelay = world.physics.integrator().replayDelay();
        if (Math.abs(average - TARGET_AMOUNT_REPLAY_STATES) <= 1) {
            return;
        }
        var newValue = currentReplayDelay;
        if (average > TARGET_AMOUNT_REPLAY_STATES) {
            newValue -= 20;
        } else if (average < TARGET_AMOUNT_REPLAY_STATES) {
            newValue += 20;
        }
        world.physics.integrator().replayDelay(Math.max(Math.min(newValue, 400), 0));
    }

    function calculateModeReplayStateCount(bodies) {
        var i, len;
        var counts = {};
        var mode_i, mode_max;
        for (i = 0, len = MAX_REPLAY_STATE_QUEUE_LEN; i <= len; i++) {
            counts[i] = 0;
        }
        for (i = 0, len = bodies.length; i < len; i++) {
            counts[bodies[i].replayStateCount()]++;
        }
        mode_max = 0;
        mode_i = 0;
        for (i = 0, len = MAX_REPLAY_STATE_QUEUE_LEN; i <= len; i++) {
            if (counts[i] > mode_max) {
                mode_max = counts[i];
                mode_i = i;
            }
        }
        return mode_i;
    }
}

module.exports = Movement;
module.exports.$inject = ['$container', 'Hex', 'Entity', 'component/Movable', 'component/Placement', 'component/Follow', 'World', 'lib/physicsjs'];
