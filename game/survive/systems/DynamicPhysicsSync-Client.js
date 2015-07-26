"use strict";
var limit = require('game/etc/ratelimiter');

function DynamicPhysicsSyncClient(container, socket, world, game, physics) {
    var MAX_REPLAY_STATE_QUEUE_LEN = 5;
    var MAX_POSITION_ERROR = 1;

    var physicsDataQueue = [];

    game.events.once('worldLoaded', function() {
        socket.on('physicsDataRaw', function (message) {
            physicsDataQueue.push(message);
        });
    });
    function overwriteState(body, newState) {
        var scratch = physics.scratchpad();

        var state = body.state;
        var old = body.state.old;

        if (newState.old) {
            old.pos.clone(newState.old.pos);
            old.vel.clone(newState.old.vel);
            old.acc.clone(newState.old.acc);
            old.angular.pos = newState.old.angular.pos;
            old.angular.vel = newState.old.angular.vel;
            old.angular.acc = newState.old.angular.acc;
        }
        state.pos.clone(newState.pos);
        state.vel.clone(newState.vel);
        state.acc.clone(newState.acc);
        state.angular.pos = newState.angular.pos;
        state.angular.vel = newState.angular.vel;
        state.angular.acc = newState.angular.acc;

        scratch.done();
    }

    function stateToReplay(body, state, time) {
        var scratch = physics.scratchpad();
        if (body.integrationMode() === 'future') {
            while (body.replayStateCount() >= MAX_REPLAY_STATE_QUEUE_LEN) {
                body.clearOldestReplayState();
            }
            if (scratch.vector().clone(state.pos).dist(body.state.pos) > (MAX_POSITION_ERROR * (body.replayStateCount() + 1))) {
                // if it gets too far behind or too distant, force it to catch up
                body.clearAllReplayStates();
                body.state.pos.clone(state.pos);
            }
            body.addReplayState(state, time);
        }
        scratch.done();
    }

    function stateFromTransportFormat(state) {
        return {
            pos: {
                x: state[0],
                y: state[1]
            },
            vel: {
                x: state[2] / 100,
                y: state[3] / 100
            },
            angular: {
                pos: state[4],
                vel: state[5] / 100,
                acc: state[6]
            }
        };
    }

    this.step = function step() {
        var message = null;
        while (physicsDataQueue.length > 0) {
            // only care about the newest message
            message = physicsDataQueue.pop();
        }
        if (message) {
            message.data.forEach(function(enemyData) {
                var ent = world.entityById(enemyData.id);
                if (ent) {
                    // // ignore automatic sync updates since it's handled here
                    // ent.components.placement.ignoreUpdates = true;
                    // ent.components.movable.ignoreUpdates = true;

                    //overwriteState(ent.components.movable.body, enemyData.state);

                    stateToReplay(ent.components.movable.body, stateFromTransportFormat(enemyData.state), new Date(message.time));
                }
            });
        }
    };
}

module.exports = DynamicPhysicsSyncClient;
module.exports.$inject = ['$container', 'socket', 'World', 'Game', 'lib/physicsjs'];
