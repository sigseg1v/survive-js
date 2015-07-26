"use strict";
var limit = require('game/etc/ratelimiter');

function ChunkManagerServer(world, clientStateManager) {
    var self = this;
    var limit_sendQueuedAdds = limit(1000, sendQueuedAdds);
    var limit_setObservableChunksForPlayers = limit(1000, function () {
        clientStateManager.clients.forEach(function (client) {
            var chunksBefore = client.chunkIdMap;
            self.setObservableChunksForClient(client);
            Object.keys(client.chunkIdMap).forEach(function (chunkId) {
                if (!chunksBefore[chunkId]) {
                    var chunk = client.chunkIdMap[chunkId];
                    if (chunk) {
                        world.sendEntitiesToSocketFragmented(client.socket,
                            chunk.getEntityIds().map(function (entId) { return world.entityById(entId); })
                        );
                    }
                }
            });
            client.socket.emit('ChunkManager.loadedChunks', client.chunkMapToNetwork());
        });
    });

    function sendQueuedAdds() {
        clientStateManager.clients.forEach(function (client) {
            var ents = [];
            client.getAndClearEntityIdsToUpdate().forEach(function (id) {
                var ent = world.entityById(id);
                if (ent && ent.__chunkData.some(function (chunk) { return client.chunkIdMap[chunk.getHashCode()]; })) {
                    ents.push(ent);
                }
            });
            if (ents.length > 0) {
                world.sendEntitiesToSocketFragmented(client.socket, ents);
            }
        });
    }

    self.setObservableChunksForClient = function setObservableChunksForClient(client) {
        var x1, x2, y1, y2, i, j, entity;

        entity = client.player;
        if (!entity) return;
        var body = entity.components.movable ? entity.components.movable.body : null;
        var placement = entity.components.placement;
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
            return;
        }
        var minX = Math.floor(x1 / world.chunkStore.chunkWidth);
        var maxX = Math.floor(x2 / world.chunkStore.chunkWidth);
        var minY = Math.floor(y1 / world.chunkStore.chunkHeight);
        var maxY = Math.floor(y2 / world.chunkStore.chunkHeight);
        if (minX === maxX) {
            minX = minX - 1;
            maxX = maxX + 1;
        }
        if (minY === maxY) {
            minY = minY - 1;
            maxY = maxY + 1;
        }
        client.chunkIdMap = {};
        for (i = minX; i <= maxX; i++) {
            for (j = minY; j <= maxY; j++) {
                if (world.chunkStore.chunks[i] && world.chunkStore.chunks[i][j]) {
                    client.chunkIdMap['i' + i + 'j' + j] = world.chunkStore.chunks[i][j];
                }
            }
        }
    };

    self.step = function step() {
        var i, j, len, jlen;
        var ent;
        var nonStatics = world.nonStaticEntities;

        var chunks = world.chunkStore.chunkList;
        for (i = 0, len = nonStatics.length; i < len; i++) {
            ent = nonStatics[i];
            if (world.checkEntityCrossingChunkBoundary(ent)) {
                world.updateChunksForEntity(ent);
                for (j = 0, jlen = ent.__chunkData.length; j < jlen; j++) {
                    world.wakeChunk(ent.__chunkData[j]);
                }
            }
        }
        for (i = 0, len = chunks.length; i < len; i++) {
            if (chunks[i].nonStaticEntityCount === 0) {
                world.sleepChunk(chunks[i]);
            }
        }
        limit_setObservableChunksForPlayers();
        limit_sendQueuedAdds();
    };
}

module.exports = ChunkManagerServer;
module.exports.$inject = [ 'World', 'ClientStateManager' ];
