"use strict";
var simplify = require('simplify-js');
var jsts = require('jsts');
var geometryFactory = new jsts.geom.GeometryFactory();

// listens for world:geometryChanged(bodies) and publishes world:boundaryChanged(points)
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
        worldPolys.forEach(function (poly) {
            // smooth out by removing a lot of redundant points
            poly.shell.points = simplify(poly.shell.points, 0.05, true);
        });

        game.events.emit('world:boundaryChanged',
            {
                shells: worldPolys.map(function (poly) {
                        return poly.shell.points;
                    })
            });
    }
}

function createPoly(points, translation) {
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
