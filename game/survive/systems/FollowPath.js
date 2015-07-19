"use strict";
var isServer = typeof window === 'undefined';

function FollowPath(container, Movable, Placement, Path, world, physics) {
    var WP_TAG_RANGE = 1;

    this.step = function step(time) {
        var scratch = physics.scratchpad();
        var wpVector = scratch.vector();
        Path.forWith([Movable.name, Placement.name], function (ent) {
            var comp = ent.components.path;
            var position = ent.components.placement.position;
            var movable = ent.components.movable;
            if (comp.currentWaypoint) {
                wpVector.clone(comp.currentWaypoint);
                if (wpVector.dist(position) < WP_TAG_RANGE) {
                    trySetNextWaypoint(comp);
                }
            } else {
                trySetNextWaypoint(comp);
            }

            if (comp.currentWaypoint) {
                movable.velocity.clone(wpVector.clone(comp.currentWaypoint).vsub(position).normalize().mult(movable.speed));
            }
        });
        scratch.done();
    };

    function trySetNextWaypoint(pathComp) {
        if (pathComp.path && pathComp.path.length > 0) {
            pathComp.currentWaypoint = pathComp.path.shift();
        } else {
            pathComp.currentWaypoint = null;
        }
    }
}

module.exports = FollowPath;
module.exports.$inject = ['$container', 'component/Movable', 'component/Placement', 'component/Path', 'World', 'lib/physicsjs'];
