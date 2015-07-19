"use strict";

var Block = require('../../engine/world/Block.js');

function ChunkManagerClient(socket, world, game, Model) {
    var self = this;
    var loadedChunks = null;
    var pruning = false;
    var pruneCandidates = [];
    var floorTiles = [];
    var player = null;

    var CHUNK_WIDTH = world.CHUNK_WIDTH;
    var CHUNK_HEIGHT = world.CHUNK_HEIGHT;

    game.events.on('playerLoaded', function (ent) { player = ent; });

    socket.on('ChunkManager.loadedChunks', function (data) {
        var before = loadedChunks || {};
        loadedChunks = data;
        if (Object.keys(before).some(function (key) { return !loadedChunks[key]; })) {
            // some chunk was unloaded -> prune entity list
            Object.keys(world.entitiesById).map(function (k) { return world.entitiesById[k]; }).forEach(function (entity) {
                if (!entityIsInLoadedChunk(entity) && pruneCandidates.indexOf(entity) === -1 && entity !== player) {
                    pruneCandidates.push(entity);
                }
            });
            pruneEntitiesFragmented();
        }
        setFloorTileVisibility();
    });

    socket.on('World.floorTiles', function (data) {
        floorTiles.forEach(function (tile) {
            game.events.emit('removeGraphics', tile.sprite);
        });
        floorTiles = data.map(function (item) {
            var block = new Block(item.x, item.y);
            var sprite = Model.createSprites('floor')[0];
            sprite.staticPosition = {
                x: block.x,
                y: block.y
            };
            return {
                block: block,
                sprite: sprite
            };
        });
        floorTiles.forEach(function (tile) {
            game.events.emit('addGraphics', tile.sprite);
        });
        setFloorTileVisibility();
    });

    function setFloorTileVisibility() {
        var tile;
        var x, y;

        // TODO -- if this array gets too big, we can do this differently
        for (var i = floorTiles.length - 1; i > 0; i--) {
            tile = floorTiles[i];
            x = tile.block.x;
            y = tile.block.y;
            if (tile.sprite.visible && !coordsAreInLoadedChunk(x, y, x, y)) {
                tile.sprite.visible = false;
            } else if (!tile.sprite.visible && coordsAreInLoadedChunk(x, y, x, y)) {
                tile.sprite.visible = true;
            }
        }
    }

    function pruneEntitiesFragmented(continuing) {
        if (!continuing && pruning) {
            return;
        }
        pruning = true;
        var entity;
        var numToPruneThisRun = Math.min(20, pruneCandidates.length);
        while (numToPruneThisRun-- > 0) {
            entity = pruneCandidates.pop();
            // need to retest here to see both if the ent still exists and if it's still
            // in place to be removed, since we are processing this array over multiple cycles
            if (world.entityById(entity.id) && !entityIsInLoadedChunk(entity)) {
                world.removeEntity(entity);
            }
        }
        if (pruneCandidates.length > 0) {
            // this takes an amazing amount of stress off the frame processing length,
            // and doesn't even really hurt, because we can afford to remove items over time
            // rather than in a huge chunk
            setTimeout(pruneEntitiesFragmented.bind(self, true), 50);
        } else {
            pruning = false;
        }
    }

    function entityIsInLoadedChunk(entity) {
        var body = entity.components.movable ? entity.components.movable.body : null;
        var placement = entity.components.placement;
        var x1, x2, y1, y2;
        if (body) {
            var aabb = body.aabb();
            x1 = aabb.x - aabb.hw;
            x2 = aabb.x + aabb.hw;
            y1 = aabb.y - aabb.hh;
            y2 = aabb.y + aabb.hh;
        } else if (placement) {
            x1 = placement.position.x;
            x2 = x1;
            y1 = placement.position.y;
            y2 = y1;
        } else {
            return true;
        }
        return coordsAreInLoadedChunk(x1, y1, x2, y2);
    }

    function coordsAreInLoadedChunk(x1, y1, x2, y2) {
        if (!loadedChunks) {
            return false;
        }

        var minX = Math.floor(x1 / CHUNK_WIDTH);
        var maxX = Math.floor(x2 / CHUNK_WIDTH);
        var minY = Math.floor(y1 / CHUNK_HEIGHT);
        var maxY = Math.floor(y2 / CHUNK_HEIGHT);
        var i, j;
        for (i = minX; i <= maxX; i++) {
            for (j = minY; j <= maxY; j++) {
                if (loadedChunks['i' + i + 'j' + j]) {
                    return true;
                }
            }
        }
        return false;
    }

    self.step = function step() {
        var i, len;
        var ent;
        var nonStatics = world.nonStaticEntities;

        if (loadedChunks !== null) {
            var toRemove = [];
            for (i = 0, len = nonStatics.length; i < len; i++) {
                ent = nonStatics[i];
                if (!entityIsInLoadedChunk(ent) && player && ent !== player) {
                    toRemove.push(ent);
                }
            }
            for (i = 0, len = toRemove.length; i < len; i++) {
                world.removeEntity(toRemove[i]);
            }
        }
    };
}

module.exports = ChunkManagerClient;
module.exports.$inject = [ 'socket', 'World', 'Game', 'component/Model'];
