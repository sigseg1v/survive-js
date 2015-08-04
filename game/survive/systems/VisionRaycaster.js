"use strict";

function VisionRaycaster(game, tuning, LightrayIntersector, physics) {
    var self = this;

    // worldBoundary points and segments are calculated from data coming out of the boundary manager
    var worldBoundaryPoints = [];
    var worldBoundarySegments = []; // even indicies are vectors to start of segment, odd indicies are the vector along the segment

    // segments and points are for entities with LightrayIntersector
    var points = [];
    var segments = []; // even indicies are vectors to start of segment, odd indicies are the vector along the segment

    var visionLightmaskPoints = [];
    var pointsToSend = [];
    var player = null;

    self.center = new physics.vector();
    var lightRadius = 1;

    // TODO -- this should actually be a promise and not a game event
    game.events.once('playerLoaded', function(ent) {
        player = ent;
        self.center = player.components.placement.position;
        lightRadius = player.components.lightsource.scale * 20; // TODO -- fix this hardcoded scale modifier
    });

    game.events.on('world:boundaryChanged', onWorldBoundaryPointsChanged);
    function onWorldBoundaryPointsChanged(data) {
        var i, ilen, j, jlen, base, offset;
        while (worldBoundaryPoints.length !== 0) {
            worldBoundaryPoints.pop();
        }
        while (worldBoundarySegments.length !== 0) {
            worldBoundarySegments.pop();
        }
        for (i = 0, ilen = data.shells.length; i < ilen; i++) {
            // note that the boundary data contains the end point same as start point in each polygon
            for (j = 0, jlen = data.shells[i].length - 1; j < jlen; j++) {
                base = new physics.vector(data.shells[i][j]);
                offset = new physics.vector(data.shells[i][j + 1]).vsub(base);
                worldBoundaryPoints.push(base);
                worldBoundarySegments.push(base, offset);
            }
        }
    }

    // this is intended to be used in an animate loop so do it as fast as called
    self.step = function step() {
        var i, len;
        var entity, entities;
        var scratch = physics.scratchpad();
        var vectorScratch = scratch.vector();
        var point;
        var segStart, segVec;

        while (visionLightmaskPoints.length !== 0) {
            visionLightmaskPoints.pop();
        }

        while (pointsToSend.length !== 0) {
            pointsToSend.pop();
        }

        entities = LightrayIntersector.entities; // it's fine to burn through this on the clientside (but it wouldn't be on the server) because the clientside is filtered to visible chunks
        for (i = 0, len = entities.length; i < len; i++) {
            entity = entities[i];
            if (vectorScratch.clone(entity.components.placement.position).vsub(self.center).norm() <= (lightRadius + 1 /* account for geometry width */)) {
                addGeometryFor(entity, scratch);
            }
        }

        // also copy in world geometry data -- we can still filter out a lot of it based on the light radius
        for (i = 0, len = worldBoundaryPoints.length; i < len; i++) {
            point = worldBoundaryPoints[i];
            if (vectorScratch.clone(point).vsub(self.center).norm() <= lightRadius) {
                points.push(point);
            }
        }
        for (i = 0, len = worldBoundarySegments.length; i < len; i+=2) {
            segStart = worldBoundarySegments[i];
            segVec = worldBoundarySegments[i + 1];
            // use twice the light radius when trying to see if wall segments intersect with the
            // vision radius, because we want lines connect to those off the screen to appear straighter
            if (segmentIntersectsCircle(segStart, segVec, self.center, lightRadius * 2)) {
                segments.push(segStart);
                segments.push(segVec);
            }
        }

        addBaseVisionPoints(scratch);

        for (i = 0, len = points.length; i < len; i++) {
            castToEitherSide(points[i]);
        }

        sortPointsByOrientation();

        // remove duplicates -- we could probably use some different kind of simplify step here
        var last = visionLightmaskPoints[0];
        if (visionLightmaskPoints.length > 0) {
            pointsToSend.push(last);
        }
        for (i = 1, len = visionLightmaskPoints.length; i < len; i++) {
            if (!visionLightmaskPoints[i].equals(last)) {
                pointsToSend.push(visionLightmaskPoints[i]);
            }
            last = visionLightmaskPoints[i];
        }

        if (pointsToSend.length > 1) {
            var lastScratch = scratch.vector().clone(pointsToSend[0]).vsub(self.center);
            var currentScratch = scratch.vector();
            var currentPoint;
            for (i = 1; i < pointsToSend.length; i++) {
                currentPoint = pointsToSend[i];
                currentScratch.clone(currentPoint).vsub(self.center);
                lastScratch.clone(currentScratch);
            }
        }
        game.events.emit('vision:pointsUpdated', pointsToSend);

        while (segments.length !== 0) {
            segments.pop();
        }
        while (points.length !== 0) {
            points.pop();
        }

        scratch.done();
    };

    function addGeometryFor(entity, scratch) {
        var i, len;
        var base, offset, next;
        var pos = entity.components.placement.position;
        var verts = entity.components.movable.body.geometry.vertices;
        var vertTotalLength = verts.length;
        if (verts && vertTotalLength > 1) {
            for (i = 0, len = vertTotalLength - 1; i < len; i++) {
                // this results in a ton of overlap between neighbours -- might be able to optimize
                base = scratch.vector().clone(verts[i]).vadd(pos);
                offset = scratch.vector().clone(verts[i + 1]).vsub(verts[i]);
                points.push(base);
                segments.push(base, offset);
            }
            // close it
            base = scratch.vector().clone(verts[vertTotalLength - 1]).vadd(pos);
            offset = scratch.vector().clone(verts[0]).vsub(verts[vertTotalLength - 1]);
            points.push(base);
            segments.push(base, offset);
        }
    }

    function addBaseVisionPoints(scratch) {
        for (var i = 0; i < 12; i++) {
            points.push(scratch.vector().set(1, 0).rotate(i * Math.PI / 6).mult(lightRadius).vadd(self.center));
        }
    }

    var castToEitherSide_scratch = new physics.vector();
    function castToEitherSide(point) {
        var up = castToEitherSide_scratch.clone(point).vsub(self.center).rotate(0.00001).normalize().mult(lightRadius);
        visionLightmaskPoints.push(castToward(up));
        var down = castToEitherSide_scratch.clone(point).vsub(self.center).rotate(-0.00001).normalize().mult(lightRadius);
        visionLightmaskPoints.push(castToward(down));
    }

    var castToward_scratch1 = new physics.vector();
    var castToward_scratch2 = new physics.vector();
    var castToward_scratch3 = new physics.vector();
    function castToward(point) {
        var castSegment = castToward_scratch1.clone(point);
        var scratchNorm = castToward_scratch2;
        var closestPoint = null;
        var output;
        for (var i = 0, len = segments.length; i < len; i+=2) {
            var intersects = segmentIntersects(self.center, castSegment, segments[i], segments[i+1]);
            if (intersects) {
                if (closestPoint === null) {
                    closestPoint = castToward_scratch3.clone(intersects);
                } else if (scratchNorm.clone(intersects).vsub(self.center).norm() < scratchNorm.clone(closestPoint).vsub(self.center).norm()){
                    closestPoint.clone(intersects);
                }
            }
        }

        if (closestPoint) {
            // intersect, add point of intersection
            output = new physics.vector(closestPoint);
        } else {
            // no intersect -- light extends fully along vector, so add endpoint
            output = new physics.vector(castSegment).vadd(self.center);
        }
        return output;
    }

    // http://stackoverflow.com/a/565282
    var intersect_scratch = new physics.vector();
    function segmentIntersects(segAoffset, segA, segBoffset, segB) {
        var u, t;
        var p = segAoffset, q = segBoffset, r = segA, s = segB;
        var q_sub_p = intersect_scratch.clone(q).vsub(p);
        var r_cross_s = r.cross(s);
        if (r_cross_s === 0) {
            // in this case, it is possible that the lines are:
            //     collinear -- for optimization we don't care about this case, even though they can technically be on top of each other
            //     this occurs when q_sub_p.cross(r) === 0
            // or
            //     parallel and non-intersecting
            //     this occurs when q_sub_p.cross(r) !== 0
            // in both cases we want to just return false, so don't even do the calculations
            return false;
        } else {
            t = q_sub_p.cross(s) / r_cross_s;
            u = q_sub_p.cross(r) / r_cross_s;
            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                // lines meet at point (p + tr) which is the same as (q + us)
                var out = new physics.vector(p).vadd(intersect_scratch.clone(r).mult(t));
                return out;
            }
            // else -- lines do not intersect
        }
        return false;
    }

    var segmentIntersectsCircle_scratch1 = new physics.vector();
    var segmentIntersectsCircle_scratch2 = new physics.vector();
    function segmentIntersectsCircle(lineStart, lineVector, circleCenter, circleRadius) {
        var startToCircleCenter = segmentIntersectsCircle_scratch1.clone(circleCenter).vsub(lineStart);
        var projOntoLine = segmentIntersectsCircle_scratch2.clone(startToCircleCenter).vproj(lineVector);
        // TODO -- I am not sure if this is actually correct or if I have to check the length of one of these vectors
        return (projOntoLine.dist(startToCircleCenter) <= circleRadius);
    }

    var sortPointsByOrientation_scratch = new physics.vector();
    function sortPointsByOrientation() {
        var angleScratch = sortPointsByOrientation_scratch;
        visionLightmaskPoints.sort(sortByOffsetOrientation);

        function sortByOffsetOrientation(a, b) {
            var a_angle = angleScratch.clone(a).vsub(self.center).angle();
            var b_angle = angleScratch.clone(b).vsub(self.center).angle();
            return b_angle - a_angle;
        }
    }
}

module.exports = VisionRaycaster;
module.exports.$inject = ['Game', 'Tuning', 'component/LightrayIntersector', 'lib/physicsjs'];
