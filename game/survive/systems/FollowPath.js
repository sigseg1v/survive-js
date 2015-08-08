"use strict";
var isServer = typeof window === 'undefined';
var limit = require('game/etc/ratelimiter');

function FollowPath(container, game, Movable, Placement, Path, world, physics) {
    var WP_TAG_RANGE = 1;

    var waypointsExpired = {};

    game.events.on('removeEntity', onRemoveEntity);

    var limit_flushExpiredWaypoints = limit(200, flushExpiredWaypoints);

    function onRemoveEntity(ent) {
        if (waypointsExpired[ent.id]) {
            delete waypointsExpired[ent.id];
        }
    }

    this.step = function step(time) {
        var scratch = physics.scratchpad();
        var wpVector = scratch.vector();
        Path.forWith([Movable.name, Placement.name], function (ent) {
            var comp = ent.components.path;
            var placement = ent.components.placement;
            var movable = ent.components.movable;
            if (comp.currentWaypoint) {
                wpVector.clone(comp.currentWaypoint);
                if (wpVector.dist(placement.position) < WP_TAG_RANGE) {
                    if (!trySetNextWaypoint(comp)) {
                        waypointsExpired[ent.id] = ent;
                    }
                }
            } else {
                if (!trySetNextWaypoint(comp)) {
                    waypointsExpired[ent.id] = ent;
                }
            }

            if (comp.currentWaypoint) {
                movable.velocity.clone(wpVector.clone(comp.currentWaypoint).vsub(placement.position).normalize().mult(movable.speed));
                if (!movable.velocity.equals(physics.vector.zero)) {
                    placement.orientation = movable.velocity.angle();
                }
            }
        });

        limit_flushExpiredWaypoints();

        scratch.done();
    };

    function trySetNextWaypoint(pathComp) {
        if (pathComp.path && pathComp.path.length > 0) {
            pathComp.currentWaypoint = pathComp.path.shift();
            return true;
        } else {
            pathComp.currentWaypoint = null;
            return false;
        }
    }

    function flushExpiredWaypoints() {
        var ids = Object.keys(waypointsExpired);
        if (ids.length === 0) {
            return;
        }
        game.events.emit('path:waypoints-expired', ids.map(function (id) { return waypointsExpired[id]; }));
        waypointsExpired = {};
    }
}

module.exports = FollowPath;
module.exports.$inject = ['$container', 'Game', 'component/Movable', 'component/Placement', 'component/Path', 'World', 'lib/physicsjs'];
