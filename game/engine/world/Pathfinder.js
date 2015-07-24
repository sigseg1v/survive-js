"use strict";

var registeredExtensions = false;

function Pathfinder(physics, world, game) {
    var self = this;

    if (!registeredExtensions) {
        physics.scratchpad.register('pathfindingData', PathfindingData);
        registeredExtensions = true;
    }

    // cache paths where key is destination x,y pair, and value is an directed graph keyed by x,y
    var cachedPaths = {};
    function cachePath(path) {
        if (path.length < 2) {
            return;
        }
        var index = 0;
        var len = path.length - 1;
        var destNode = path[0];
        var hash = hashPair(destNode.x, destNode.y);
        if (cachedPaths[hash] === undefined) {
            cachedPaths[hash] = {};
        }
        var directedGraph = cachedPaths[hash];

        var currentNode, startNode, lastNode;
        lastNode = destNode;
        while (++index < len) {
            currentNode = path[index];
            directedGraph[hashPair(currentNode.x, currentNode.y)] = lastNode;
            lastNode = currentNode;
        }
    }
    function cachedPathExistsFrom(start, end) {
        var endHash = hashPair(end.x, end.y);
        if (cachedPaths[endHash] !== undefined) {
            var startLoc = cachedPaths[endHash][hashPair(start.x, start.y)];
            if (startLoc !== undefined) {
                return startLoc;
            }
        }
        return false;
    }
    function getCachedPath(start, end) {
        var path = [];
        var directedGraph = cachedPaths[hashPair(end.x, end.y)];
        var currentNode = directedGraph !== undefined ? directedGraph[hashPair(start.x, start.y)] : undefined;
        while (true) {
            if (currentNode === undefined) {
                console.log('Cached path lookup failed.');
                return path;
            }
            path.push(currentNode);
            if (currentNode.x === end.x && currentNode.y === end.y) {
                break;
            }
            currentNode = directedGraph[hashPair(currentNode.x, currentNode.y)];
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

    self.clearCache = function () {
        cachedPaths = {};
    };

    // options:
    //      start <required> : position to start path from
    //      end <required> : position to find path to
    //      cache: cache the resulting path for faster lookup from subsequent searches
    //      colliderTypes: filters which entities you can collide with based on physicsjs-style rules; does not work nicely with cache (yet)
    //      alwaysCollideWithBlockAt: given an {x, y} object, will always consider it as colliding. this is useful for determining if a new path _will_ block something after it is placed
    //      skipCache: will always find the absolute shortest path, at the cost of a longer running algorithm
    self.findPath = function findPath(options) {
        var scratch = physics.scratchpad();
        var start = options.start;
        var end = options.end;
        var colliderTypes = options.colliderTypes || { "$in": ['wall', 'building'], "$nin": ['base'] };
        var alwaysCollideWithBlockAt = options.alwaysCollideWithBlockAt ? scratch.block().set(options.alwaysCollideWithBlockAt.x, options.alwaysCollideWithBlockAt.y) : null;
        var storeToCache = options.cache;
        var useCache = !options.skipCache;

        // using A* pathfinding algorithm
        var startBlock = scratch.block().set(start.x, start.y);
        var endBlock = scratch.block().set(end.x, end.y);
        var startHeuristic = getDistanceHeuristic(start, end);
        var startBlockData = scratch.pathfindingData().set(startHeuristic, 0, startHeuristic, startBlock, null);
        var pointBody = new physics.body('point');

        // dictionaries for open and closed sets so we can do fast contains check and fast data lookup
        var open = [];
        var openHash = {};
        var closed = {};
        open.push(startBlockData);
        openHash[startBlockData.block.getHashCode()] = true;

        var current = null; // current Block
        var currentData = null; // pathfinding data for current Block
        var pathWalker;
        var bsMinIndex, bsMaxIndex, bsCurrentIndex, bsCurrentElement;
        while (open.length > 0)
        {
            // open.sort(function (a, b) {
            //     return b.f - a.f;
            // });
            currentData = open.pop();
            current = currentData.block;
            openHash[current.getHashCode()] = false;

            if (useCache && cachedPathExistsFrom(current, endBlock)) {
                // if a cached path exists, then just burn through it filling the current path along the way
                var cachedBlockPath = getCachedPath(current, endBlock);
                // console.log('cached path exists with length', cachedBlockPath.length);
                var cachedPathCurrent;
                for (var cachedPathIndex = 0, cachedPathLength = cachedBlockPath.length; cachedPathIndex < cachedPathLength; cachedPathIndex++) {
                    cachedPathCurrent = cachedBlockPath[cachedPathIndex];
                    currentData = scratch.pathfindingData().set(0, 0, 0, scratch.block().set(cachedPathCurrent.x, cachedPathCurrent.y), currentData);
                    current = currentData.block;
                }
            }
            if (current.equals(endBlock)) {
                // check if we are about to add the end position to the closed list, if so, we have found a path
                var finalPath = [];
                var finalBlockPath = [];
                pathWalker = currentData;
                while (pathWalker)
                {
                    finalPath.push(pathWalker.block.getCenter());
                    finalBlockPath.push({ x: pathWalker.block.x, y: pathWalker.block.y });
                    pathWalker = pathWalker.parent;
                }
                finalPath.reverse();
                scratch.done();
                if (storeToCache) {
                    cachePath(finalBlockPath);
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
                var neighbour = scratch.block().set(neighbourPositions[pos_i][0], neighbourPositions[pos_i][1]);
                var neighbourPosition = scratch.vector().set(neighbour.x, neighbour.y);
                pointBody.state.pos.clone(neighbourPosition);
                var collide = collidesWith(pointBody, alwaysCollideWithBlockAt, colliderTypes);

                // if this node is already on the closed list, or if we can't move there, then ignore it
                if (!closed[neighbour.getHashCode()] && !collide)
                {
                    var g = currentData.g + 10; // need to account for distance to neighbour here
                    var neighbourInOpenSet = openHash[neighbour.getHashCode()];
                    if (!neighbourInOpenSet || g < neighbourInOpenSet.g) {
                        var h = getDistanceHeuristic(neighbourPosition, end);
                        var f = g + h;

                        if (neighbourInOpenSet) {
                            neighbourInOpenSet.set(f, g, h, neighbour, currentData);
                        } else {
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

                            openHash[neighbour.getHashCode()] = true;
                        }
                    }
                }
            }
        }

        // no path found
        scratch.done();
        return null;
    };

    function collidesWith(body, alwaysCollideWithBlockAt, colliderTypes) {
        var i, j, k, len, lenj, lenk, ignored;
        var scratch = physics.scratchpad();
        var block = scratch.block().set(body.state.pos.x, body.state.pos.y);
        if (alwaysCollideWithBlockAt && alwaysCollideWithBlockAt.x === block.x && alwaysCollideWithBlockAt.y === block.y) {
            scratch.done();
            return true;
        }
        var candidates = world.queryStaticItemsAtPoint(block);
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

    // Manhattan distance for square grid
    function getDistanceHeuristic(start, end) {
        var dx = Math.abs(start.x - end.x);
        var dy = Math.abs(start.y - end.y);
        return dx + dy;
    }

    function getSign(n) {
        return (n > 0) ? 1 : ((n < 0) ? -1 : n);
    }

    function PathfindingData(f, g, h, block, parent) {
        this.set(f, g, h, block, parent);
    }
    PathfindingData.prototype.set = function set(f, g, h, block, parent) {
        this.f = f;
        this.g = g;
        this.h = h;
        this.block = block;
        this.parent = parent || null;
        return this;
    };
}

module.exports = Pathfinder;
module.exports.$inject = [ 'lib/physicsjs', 'World', 'Game'];
