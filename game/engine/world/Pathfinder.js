"use strict";

var registeredExtensions = false;

function Pathfinder(physics, world, game) {
    var self = this;

    if (!registeredExtensions) {
        physics.scratchpad.register('pathfindingData', PathfindingData);
        registeredExtensions = true;
    }

    // cache paths where key is destination q,r pair, and value is an directed graph keyed by q,r
    var cachedPaths = {};
    function cachePath(path) {
        if (path.length < 2) {
            return;
        }
        var index = 0;
        var len = path.length - 1;
        var destNode = path[0];
        var hash = hashPair(destNode.q, destNode.r);
        if (cachedPaths[hash] === undefined) {
            cachedPaths[hash] = {};
        }
        var directedGraph = cachedPaths[hash];

        var currentNode, startNode, lastNode;
        lastNode = destNode;
        while (++index < len) {
            currentNode = path[index];
            directedGraph[hashPair(currentNode.q, currentNode.r)] = lastNode;
            lastNode = currentNode;
        }
    }
    function cachedPathExistsFrom(start, end) {
        var endHash = hashPair(end.q, end.r);
        if (cachedPaths[endHash] !== undefined) {
            var startLoc = cachedPaths[endHash][hashPair(start.q, start.r)];
            if (startLoc !== undefined) {
                return startLoc;
            }
        }
        return false;
    }
    function getCachedPath(start, end) {
        var path = [];
        var directedGraph = cachedPaths[hashPair(end.q, end.r)];
        var currentNode = directedGraph !== undefined ? directedGraph[hashPair(start.q, start.r)] : undefined;
        while (true) {
            if (currentNode === undefined) {
                console.log('Cached path lookup failed.');
                return path;
            }
            path.push(currentNode);
            if (currentNode.q === end.q && currentNode.r === end.r) {
                break;
            }
            currentNode = directedGraph[hashPair(currentNode.q, currentNode.r)];
        }
        return path;
    }

    // hashing function that works for two 16bit signed numbers
    function hashPair(x, y) {
        return ( (x & 0x80000000) | ((y & 0x80000000) >>> 1) | ((x & 0x7FFF) << 15) | (y & 0x7FFF) )|0;
    }

    game.events.on('addEntity', function (ent) {
        if (ent.components.movable && ent.components.movable.body.treatment === 'static') {
            cachedPaths = {};
        }
    });
    game.events.on('removeEntity', function (ent) {
        if (ent.components.movable && ent.components.movable.body.treatment === 'static') {
            cachedPaths = {};
        }
    });

    // options:
    //      start <required> : position to start path from
    //      end <required> : position to find path to
    //      cache: cache the resulting path for faster lookup from subsequent searches
    //      colliderTypes: filters which entities you can collide with based on physicsjs-style rules; does not work nicely with cache (yet)
    //      alwaysCollideWithHexAt: given an {x, y} object, will always consider it as colliding. this is useful for determining if a new path _will_ block something after it is placed
    //      skipCache: will always find the absolute shortest path, at the cost of a longer running algorithm
    self.findPath = function findPath(options) {
        var scratch = physics.scratchpad();
        var start = options.start;
        var end = options.end;
        var colliderTypes = options.colliderTypes || { "$in": ['wall', 'building'], "$nin": ['base'] };
        var alwaysCollideWithHexAt = options.alwaysCollideWithHexAt ? scratch.hex().setValuesByCartesian(options.alwaysCollideWithHexAt.x, options.alwaysCollideWithHexAt.y, 1) : null;
        var storeToCache = options.cache;
        var useCache = !options.skipCache;

        // using A* pathfinding algorithm
        var startHex = scratch.hex().setValuesByCartesian(start.x, start.y, 1);
        var endHex = scratch.hex().setValuesByCartesian(end.x, end.y, 1);
        var startHeuristic = getDistanceHeuristic(start, end);
        var startHexData = scratch.pathfindingData().set(startHeuristic, 0, startHeuristic, startHex, null);
        var pointBody = new physics.body('point');

        // dictionaries for open and closed sets so we can do fast contains check and fast data lookup
        var open = [];
        var openHash = {};
        var closed = {};
        open.push(startHexData);
        openHash[startHexData.hex.getHashCode()] = true;

        var current = null; // current Hex
        var currentData = null; // pathfinding data for current Hex
        var pathWalker;
        var bsMinIndex, bsMaxIndex, bsCurrentIndex, bsCurrentElement;
        while (open.length > 0)
        {
            // open.sort(function (a, b) {
            //     return b.f - a.f;
            // });
            currentData = open.pop();
            current = currentData.hex;
            openHash[current.getHashCode()] = false;

            if (useCache && cachedPathExistsFrom(current, endHex)) {
                // if a cached path exists, then just burn through it filling the current path along the way
                var cachedHexPath = getCachedPath(current, endHex);
                // console.log('cached path exists with length', cachedHexPath.length);
                var cachedPathCurrent;
                for (var cachedPathIndex = 0, cachedPathLength = cachedHexPath.length; cachedPathIndex < cachedPathLength; cachedPathIndex++) {
                    cachedPathCurrent = cachedHexPath[cachedPathIndex];
                    currentData = scratch.pathfindingData().set(0, 0, 0, scratch.hex().set(cachedPathCurrent.q, cachedPathCurrent.r), currentData);
                    current = currentData.hex;
                }
            }
            if (current.equals(endHex)) {
                // check if we are about to add the end position to the closed list, if so, we have found a path
                var finalPath = [];
                var finalHexPath = [];
                pathWalker = currentData;
                while (pathWalker)
                {
                    finalPath.push(pathWalker.hex.getCenter());
                    finalHexPath.push({ q: pathWalker.hex.q, r: pathWalker.hex.r });
                    pathWalker = pathWalker.parent;
                }
                finalPath.reverse();
                scratch.done();
                if (storeToCache) {
                    cachePath(finalHexPath);
                }
                return finalPath;
            }

            // add the current node to the closed list
            closed[current.getHashCode()] = currentData;

            // go through all neighbouring nodes
            var pos;
            var neighbourPositions = current.getNeighbourPositions();
            var pos_i, pos_len;
            for (pos_i = 0, pos_len = neighbourPositions.length; pos_i < pos_len; pos_i++) {
                var neighbour = scratch.hex().set(neighbourPositions[pos_i][0], neighbourPositions[pos_i][1], 1);
                var neighbourPosition = scratch.vector().set(neighbour.getX(), neighbour.getY());
                pointBody.state.pos.clone(neighbourPosition);
                var collide =  collidesWith(pointBody, alwaysCollideWithHexAt, colliderTypes);

                // if this node is already on the closed list, or if we can't move there, then ignore it
                if (!closed[neighbour.getHashCode()] && !collide)
                {
                    if (openHash[neighbour.getHashCode()])
                    {
                        // already on open list
                        // normally, here, we check if the G value to get there along this path is less,
                        // but that's impossible since all our directions on a hex grid have equal weights
                    }
                    else
                    {
                        // not on open list
                        var g = 0;
                        pathWalker = currentData;
                        while (pathWalker)
                        {
                            g += 10;
                            pathWalker = pathWalker.parent;
                        }
                        var h = getDistanceHeuristic(neighbourPosition, end);
                        var f = g + h;
                        var neighbourData = scratch.pathfindingData().set(f, g, h, neighbour, currentData);

                        // binary search to find correct spot to insert to keep sorted by f-values
                        bsCurrentIndex = 0;
                        bsMinIndex = 0;
                        bsMaxIndex = open.length - 1;
                        while (bsMinIndex <= bsMaxIndex) {
                            bsCurrentIndex = (bsMinIndex + bsMaxIndex) / 2 | 0;
                            bsCurrentElement = open[bsCurrentIndex].f;
                            if (bsCurrentElement > f) {
                                bsMinIndex = bsCurrentIndex + 1;
                            } else if (bsCurrentElement < f) {
                                bsMaxIndex = bsCurrentIndex - 1;
                            } else {
                                // item matching f found, stop search
                                break;
                            }
                        }
                        open.splice(bsCurrentIndex, 0, neighbourData);

                        //open.push(neighbourData);

                        openHash[neighbour.getHashCode()] = true;
                    }
                }
            }
        }

        // no path found
        scratch.done();
        return null;
    };

    function collidesWith(body, alwaysCollideWithHexAt, colliderTypes) {
        var i, j, k, len, lenj, lenk, ignored;
        var scratch = physics.scratchpad();
        var hex = scratch.hex().setValuesByCartesian(body.state.pos.x, body.state.pos.y, 1);
        if (alwaysCollideWithHexAt && alwaysCollideWithHexAt.q === hex.q && alwaysCollideWithHexAt.r === hex.r) {
            scratch.done();
            return true;
        }
        var candidates = world.queryStaticItemsAtHex(hex);
        for (i = 0, len = candidates.length; i < len; ++i) {
            for (j = 0, lenj = colliderTypes.$in.length; j < lenj; j++) {
                if (candidates[i].labels.indexOf(colliderTypes.$in[j]) !== -1) {
                    ignored = false;
                    for (k = 0, lenk = colliderTypes.$nin.length; k < lenk; k++) {
                        if (candidates[i].labels.indexOf(colliderTypes.$nin[k]) !== -1) {
                            ignored = true;
                            break;
                        }
                    }
                    if (!ignored) {
                        scratch.done();
                        return true;
                    }
                }
            }
        }
        scratch.done();
        return false;
    }


    // "Calculating Distance" http://www.richardssoftware.net/Home/Post?id=1
    // Manhattan distance for hexagonal grid
    function getDistanceHeuristic(start, end) {
        var scratch = physics.scratchpad();
        var startHex = scratch.hex().setValuesByCartesian(start.x, start.y, 1);
        var endHex = scratch.hex().setValuesByCartesian(end.x, end.y, 1);
        var ax = startHex.r - ((startHex.q >= 0) ? (startHex.q >> 1) : (startHex.q - 1) / 2);
        var ay = startHex.r + ((startHex.q >= 0) ? ((startHex.q + 1) >> 1) : startHex.q / 2);
        var bx = endHex.r - ((endHex.q >= 0) ? (endHex.q >> 1) : (endHex.q - 1) / 2);
        var by = endHex.r + ((endHex.q >= 0) ? ((endHex.q + 1) >> 1) : endHex.q / 2);
        var dx = bx - ax;
        var dy = by - ay;
        if (getSign(dx) === getSign(dy))
        {
            return scratch.done(Math.max(Math.abs(dx), Math.abs(dy)) * 10);
        }
        return scratch.done((Math.abs(dx) + Math.abs(dy)) * 10);
    }

    function getSign(n) {
        return (n > 0) ? 1 : ((n < 0) ? -1 : n);
    }

    function PathfindingData(f, g, h, hex, parent) {
        this.set(f, g, h, hex, parent);
    }
    PathfindingData.prototype.set = function set(f, g, h, hex, parent) {
        this.f = f;
        this.g = g;
        this.h = h;
        this.hex = hex;
        this.parent = parent || null;
        return this;
    };
}

module.exports = Pathfinder;
module.exports.$inject = [ 'lib/physicsjs', 'World', 'Game'];
