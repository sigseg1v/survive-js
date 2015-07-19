"use strict";

function StateSyncer(container, socket, world, Movable, Placement, physics) {
    var self = this;
    var MAX_POSITION_ERROR = 3;
    var MAX_REPLAY_STATE_QUEUE_LEN = 5;

    socket.on('stateUpdate', function (data) {
        var changes = data.changes || [];
        Object.keys(changes).forEach(function (compKey) {
            var entData = changes[compKey];
            entData.forEach(function (row) {
                var localEnt = world.entityById(row.id);
                if (localEnt) {
                    var comp = container.resolve(row.data.injector);
                    if (comp.reconstruct) {
                        comp.reconstruct.call(localEnt.components[compKey], row.data);
                    }
                }
            });
        });

        var physicsChanges = data.physics || [];
        physicsChanges.forEach(function (change) {
            // TODO -- reduce calls to new
            var localEnt = world.entityById(change.id);
            if (!localEnt) return;
            if (localEnt.components.movable && localEnt.components.movable.body.integrationMode() === 'future') {
                var state = {
                    pos: new physics.vector(change.data.pos),
                    vel: new physics.vector(change.data.vel),
                    acc: new physics.vector(change.data.acc),
                    angular: { pos: change.data.angularPos }
                };
                var body = localEnt.components.movable.body;



                while (body.replayStateCount() >= MAX_REPLAY_STATE_QUEUE_LEN) {
                    body.clearOldestReplayState();
                }
                if (state.pos.dist(body.state.pos) > (MAX_POSITION_ERROR * (body.replayStateCount() + 1))) {
                    // if it gets too far behind or too distant, force it to catch up
                    body.clearAllReplayStates();
                    body.state.pos.clone(state.pos);
                }
                body.addReplayState(state, new Date(data.time));
            }
        });
    });

    self.step = function step() {
    };
}

module.exports = StateSyncer;
module.exports.$inject = ['$container', 'socket', 'World', 'component/Movable', 'component/Placement', 'lib/physicsjs'];
