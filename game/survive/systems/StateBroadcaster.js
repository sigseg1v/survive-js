"use strict";
var limit = require('../../etc/ratelimiter.js');

function StateBroadcaster(socket, clientStateManager, Movable, Placement, Healable, Chargeable, Resource, Miner, Melee, Name, world) {
    var self = this;

    // components to broadcast state for
    self.components = [
        Movable,
        Placement,
        Healable,
        Chargeable,
        Resource,
        Miner,
        Melee,
        Name
    ];

    var sendChangeDelta_limit = limit(1000/20, sendChangeDelta);
    var sendFullUpdate_limit = limit(30000, sendFullUpdate);
    self.step = function step() {
        sendChangeDelta_limit();
        sendFullUpdate_limit();
    };

    // TODO -- should this only send to clients who have the correct chunks? currently sends to all
    // the idea is that the players should be near everything that is going on anyway, so it might not be useful to fix
    function sendChangeDelta() {
        var changes = {};
        self.components.forEach(function (comp) {
            changes[comp.name] = comp.getAndClearChangeData();
        });

        var physicsChangedIds = {};
        changes[Placement.name].forEach(function (row) {
            physicsChangedIds[row.id] = true;
        });
        changes[Movable.name].forEach(function (row) {
            physicsChangedIds[row.id] = true;
        });
        var physicsChanges = Object.keys(physicsChangedIds).map(function (id) {
            return world.entityById(id);
        }).filter(function (ent) {
            // have to check for non-null here because the changed entity could have been removed
            return ent && !!ent.components.movable;
        }).map(function (ent) {
            return {
                id: ent.id,
                data: {
                    pos: ent.components.movable.body.state.pos,
                    vel: ent.components.movable.body.state.vel,
                    acc: ent.components.movable.body.state.acc,
                    angularPos: ent.components.movable.body.state.angular.pos
                }
            };
        });

        Object.keys(changes).forEach(function (key) {
            if (!changes[key] || changes[key].length === 0) {
                delete changes[key];
            }
        });

        socket.sockets.emit('stateUpdate', {
            changes: changes,
            physics: physicsChanges,
            time : Number(new Date())
        });
    }

    function sendFullUpdate() {
        clientStateManager.clients.forEach(function (client) {
            var changes = {};
            self.components.forEach(function (comp) {
                changes[comp.name] = [];
            });
            var loadedChunks = client.getLoadedChunks();
            loadedChunks.forEach(function (chunk) {
                var i, ilen, j, jlen;
                var entIds = chunk.getEntityIds();
                var data;
                var compname;
                var entity;
                for (i = 0, ilen = entIds.length; i < ilen; i++) {
                    entity = world.entityById(entIds[i]);
                    if (!entity) continue; // shouldn't happen
                    for (j = 0, jlen = self.components.length; j < jlen; j++) {
                        compname = self.components[j].name;
                        data = entity.components[compname];
                        if (data !== undefined) {
                            changes[compname].push({
                                id: entity.id,
                                data: data
                            });
                        }
                    }
                }
            });

            Object.keys(changes).forEach(function (key) {
                if (!changes[key] || changes[key].length === 0) {
                    delete changes[key];
                }
            });

            client.socket.emit('stateUpdate', { changes: changes, time : Number(new Date()) });
        });
    }
}

module.exports = StateBroadcaster;
module.exports.$inject = ['socket', 'ClientStateManager', 'component/Movable', 'component/Placement', 'component/Healable', 'component/Chargeable', 'component/Resource', 'component/Miner', 'component/Melee', 'component/Name', 'World'];
