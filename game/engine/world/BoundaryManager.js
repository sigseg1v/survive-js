"use strict";
var polylines = require('simplify-js');
var jsts = require('jsts');
var geometryFactory = new jsts.geom.GeometryFactory();

// var testPoly = createPoly([{x:0, y: 0}, {x:100, y: 0}, {x:100, y: 100},{x:0, y: 100}, {x:0, y: 0}]);
// var testPoly2 = createPoly([{x:200, y: 0}, {x:300, y: 0}, {x:300, y: 100},{x:200, y: 100}, {x:200, y: 0}]);
// var cascadedUnion = jsts.operation.union.CascadedPolygonUnion.union([testPoly, testPoly2]);
// console.log(testPoly, testPoly.getCentroid(), cascadedUnion);

// holds data about wall segments, etc
function BoundaryManager(physics, world, game) {
    var self = this;

    var worldPolys = [];

    game.events.on('world:geometryChanged', onWorldGeometryChanged);

    function onWorldGeometryChanged(data) {
        var i, len, body, toRemove;
        if (data.added) {
            for (i = 0, len = data.added.length; i < len; i++) {
                body = data.added[i];
                worldPolys.push(createPoly(body.geometry.vertices, body.state.pos));
            }
        }

        if (data.removed) {
            toRemove = [];
            for (i = 0, len = data.removed.length; i < len; i++) {
                body = data.removed[i];
                toRemove.push(createPoly(body.geometry.vertices, body.state.pos));
            }
        }

        var unionedWorld = jsts.operation.union.CascadedPolygonUnion.union(worldPolys);
        if (data.removed && toRemove.length > 0) {
            var unionedRemove = jsts.operation.union.CascadedPolygonUnion.union(toRemove);
            unionedWorld = unionedWorld.difference(unionedRemove);
        }
        worldPolys = unionedWorld.geometries ? unionedWorld.geometries : [ unionedWorld ];

        game.events.emit('world:boundaryChanged',
            {
                shells: worldPolys.map(function (poly) {
                        return poly.shell.points;
                    })
            });
    }
}

function createPoly(points, translation) {
    //console.log(points.concat(points[0]).reduce(function (left, right) { return left + "{x:" + (right.x + translation.x) + ", y:" + (right.y + translation.y) + "} "; }, "before: "));
    //console.log(geometryFactory.createPolygon(geometryFactory.createLinearRing(points.concat(points[0]))).shell.points.reduce(function (left, right) { return left + "{x:" + (right.x + translation.x) + ", y:" + (right.y + translation.y) + "} "; }, "after: "));
    return geometryFactory.createPolygon(
        geometryFactory.createLinearRing(
            points.concat(points[0]).map(function (p) {
                if (!translation) {
                    return new jsts.geom.Coordinate(p.x, p.y);
                }
                return new jsts.geom.Coordinate(p.x + translation.x, p.y + translation.y);
            })
            //, holes
        )
    );
}

module.exports = BoundaryManager;
module.exports.$inject = [ 'lib/physicsjs', 'World', 'Game'];
