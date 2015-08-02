"use strict";

function VisionRaycaster(game, tuning, LightrayIntersector, physics) {
    var self = this;

    var segments = []; // even indicies are vectors to start of segment, odd indicies are the vector along the segment
    var points = []; // vectors from body.vertices
    var visionLightmaskPoints = [];
    var player = null;

    self.center = new physics.vector();
    var lightRadius = 1;

    // TODO -- this should actually be a promise and not a game event
    game.events.once('playerLoaded', function(ent) {
        player = ent;
        self.center = player.components.placement.position;
        lightRadius = player.components.lightsource.scale * 4; // TODO -- fix this hardcoded scale modifier
    });

    // this is intended to be used in an animate loop so do it as fast as called
    self.step = function step() {
        var entity, entities;
        var scratch = physics.scratchpad();
        var vectorScratch = scratch.vector();

        while (segments.length !== 0) {
            segments.pop();
        }
        while (points.length !== 0) {
            points.pop();
        }
        while (visionLightmaskPoints.length !== 0) {
            visionLightmaskPoints.pop();
        }

        entities = LightrayIntersector.entities; // it's fine to burn through this on the clientside (but it wouldn't be on the server) because the clientside is filtered to visible chunks
        for (var i = 0, len = entities.length; i < len; i++) {
            entity = entities[i];
            if (vectorScratch.clone(entity.components.placement.position).vsub(self.center).norm() <= lightRadius) {
                addGeometryFor(entity, scratch);
            }
        }
        for (i = 0, len = points.length; i < len; i++) {
            castToEitherSide(points[i]);
        }
        console.log('points in lightmask', visionLightmaskPoints.length);
        console.log('points in points array', points.length);
        console.log('points in segments array', segments.length);
        scratch.done();
    };

    function addGeometryFor(entity, scratch) {
        var i, len;
        var verts = entity.components.movable.body.geometry.vertices;
        var vertTotalLength = verts.length;
        if (verts && vertTotalLength > 1) {
            for (i = 0, len = (vertTotalLength % 2 === 0) ? vertTotalLength : vertTotalLength - 1; i < len; i+=2) {
                // this results in a ton of overlap between neighbours -- might be able to optimize
                points.push(verts[i], verts[i + 1]);
                segments.push(verts[i], scratch.vector().clone(verts[i + 1]).vsub(verts[i]));
            }
            if (vertTotalLength % 2 !== 0) {
                // add final vert since we iterated in increments of 2 above
                points.push(verts[vertTotalLength - 1]);
                segments.push(verts[vertTotalLength - 2], scratch.vector().clone(verts[vertTotalLength - 1]).vsub(verts[vertTotalLength - 2]));
            }
            // close it
            segments.push(verts[vertTotalLength - 1], scratch.vector().clone(verts[0]).vsub(verts[vertTotalLength - 1]));
        }
    }

    function castToEitherSide(point) {
        var scratch = physics.scratchpad();
        var up = scratch.vector().clone(point).rotate(0.00001).normalize().mult(lightRadius);
        var down = scratch.vector().clone(point).rotate(-0.00001).normalize().mult(lightRadius);
        visionLightmaskPoints.push(castToward(up));
        visionLightmaskPoints.push(castToward(down));
        scratch.done();
    }

    function castToward(point) {
        var scratch = physics.scratchpad();
        var castSegment = scratch.vector().clone(point).vsub(self.center);
        var outputPoint = scratch.vector();
        var scratchNorm = scratch.vector();
        var closestPoint = null;
        var output;
        for (var i = 0, len = segments.length; i < len; i+=2) {
            var intersects = segmentIntersects(self.center, castSegment, segments[i], segments[i+1], outputPoint);
            if (intersects) {
                if (closestPoint === null) {
                    closestPoint = scratch.vector(outputPoint);
                } else if (scratchNorm.clone(outputPoint).vsub(self.center).norm() < scratchNorm.clone(closestPoint).vsub(self.center).norm()){
                    closestPoint.clone(outputPoint);
                }
            }
        }

        if (closestPoint) {
            // intersect, add point of intersection
            output = new physics.vector(closestPoint);
        } else {
            // no intersect -- light extends fully along vector, so add endpoint
            output = new physics.vector(point);
        }
        scratch.done();
        return output;
    }

    // http://stackoverflow.com/a/565282
    function segmentIntersects(segAoffset, segA, segBoffset, segB, outputPoint) {
        var scratch = physics.scratchpad();
        var u, t;
        var p = segAoffset, q = segBoffset, r = segA, s = segB;
        var q_sub_p = scratch.vector().clone(q).vsub(p);
        var r_cross_s = r.cross(s);
        if (r_cross_s === 0) {
            // in this case, it is possible that the lines are:
            //     collinear -- for optimization we don't care about this case, even though they can technically be on top of each other
            //     this occurs when q_sub_p.cross(r) === 0
            // or
            //     parallel and non-intersecting
            //     this occurs when q_sub_p.cross(r) !== 0
            // in both cases we want to just return false, so don't even do the calculations
            scratch.done();
            return false;
        } else {
            t = q_sub_p.cross(s) / r_cross_s;
            u = q_sub_p.cross(r) / r_cross_s;
            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                // lines meet at point (p + tr) which is the same as (q + us)
                if (outputPoint) {
                    return scratch.done(outputPoint.clone(p).vadd(scratch.vector().clone(r).mult(t)));
                } else {
                    scratch.done();
                    return true;
                }
            }
            // else -- lines do not intersect
        }
        scratch.done();
        return false;
    }
}

module.exports = VisionRaycaster;
module.exports.$inject = ['Game', 'Tuning', 'component/LightrayIntersector', 'lib/physicsjs'];
