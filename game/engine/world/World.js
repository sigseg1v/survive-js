"use strict";
var isServer = typeof window === 'undefined';
var Entity = require('game/engine/Entity');
var Chunk = require('game/engine/world/Chunk');
var CHUNK_WIDTH = 20;
var CHUNK_HEIGHT = 12;

function World(socket, game, renderer, container, physics, clientStateManager) {
    var self = this;
    self.__physics = physics;
    self.CHUNK_WIDTH = CHUNK_WIDTH;
    self.CHUNK_HEIGHT = CHUNK_HEIGHT;
    // self.entities = [];
    self.nonStaticEntities = [];
    self.floorTiles = [];
    self.entitiesById = {};
    if (!isServer) {
        self.permanentlyRemovedEntityIdSet = {};
    }
    self.socket = socket;
    self.renderer = renderer; // TODO -- move renderer out and use events to handle add/remove graphics
    self.game = game;
    self.physics = physics({
        timestep: 16,
        maxIPF: 1,
        sleepDisabled: true,
        // sleepSpeedLimit: 0.001
    });
    if (isServer) {
        self.physics.add(physics.integrator('replay-verlet', {
            replayDelay: 0
        }));
    } else {
        self.physics.add(physics.integrator('replay-verlet', {
            replayDelay: 100
        }));
        // game.events.on('rttPingUpdate', function (rtt) {
        //     // TODO -- it would be better to keep a moving average here, something like consider average number of replay states per entity over 5s
        //     // and then try to keep the number at something reasonable like 2 or 3 by adjusting this delay
        //     self.physics.integrator().replayDelay(rtt * 2);
        // });
    }
    var preciseCollision = physics.behavior('body-collision-detection');
    self.preciseCollision = preciseCollision;
    self.physics.add(preciseCollision);
    var broadphaseCollision = physics.behavior(/*'broadphase-quadtree'*/ 'sweep-prune');
    broadphaseCollision.setPartitionDimensions(15, 15);
    self.broadphaseCollision = broadphaseCollision;
    self.physics.add(broadphaseCollision);
    self.physics.add(physics.behavior('body-impulse-response-ext'));
    self.container = container;

    // var staticItemsTree = physics.behavior('broadphase-quadtree');
    // self.staticItemsTree = staticItemsTree;

    self.staticItemStore = new BlockGridStore();

    if(!isServer) {
        socket.on('World.addEntity', function (entity) {
            if (!self.entitiesById[entity.id]) {
                World.prototype.addEntity.call(self, Entity.prototype.reconstruct(entity));
            }
        });
        socket.on('World.addEntities', function (entities) {
            var constructed = entities
                .filter(function (entity) {
                    return entity /* sometimes this batch is deferred, entity might be removed */ && !self.entitiesById[entity.id];
                })
                .map(function (entity) {
                    return Entity.prototype.reconstruct(entity);
                });
            World.prototype.addEntities.call(self, constructed);
        });
        socket.on('World.removeEntity', function (data) {
            var entity = self.entitiesById[data.id];
            if (entity) {
                self.removeEntity(entity);
            }
            if (data.permanent) {
                // since loading a chunk is the same as "adding" an entity, slow chunk loads
                // could see re-adding of dead entities due to latency if we don't keep track of them
                self.permanentlyRemovedEntityIdSet[data.id] = true;
            }
        });
    }

    if (isServer) {
        self.chunkStore = new ChunkStore(CHUNK_WIDTH, CHUNK_HEIGHT, physics);
        self.clientStateManager = clientStateManager;
    }
}

World.prototype.queryStaticItemsAtPoint = function queryStaticItemsAtPoint(point) {
    return this.queryStaticItemsAt(point.x, point.y);
};
World.prototype.queryStaticItemsAt = function queryStaticItemsAt(x, y) {
    return this.staticItemStore.queryAt(Math.floor(x), Math.floor(y));
};
// World.prototype.findAllStaticItems = function findAllStaticItems() {
//     var i, j, k, ilen, jlen, klen, nodeArray;
//     var items = this.staticItemStore.items;
//     var allItems = [];
//     // this code assumes that the array is more values than holes and that it's faster to enumerate than use Object.keys
//     for (i = 0, ilen = items.length; i < ilen; i++) {
//         if (items[i] === undefined) {
//             continue;
//         }
//         for (j = 0, jlen = items[i].length; j < jlen; j++) {
//             nodeArray = items[i][j];
//             if (nodeArray !== undefined) {
//                 for (k = 0, klen = nodeArray.length; k < klen; k++) {
//                     allItems.push(nodeArray[k]);
//                 }
//             }
//         }
//     }
//     return allItems;
// };

function BlockGridStore() {
    this.items = [];
    this.__nothing = [];
}
BlockGridStore.prototype.insertAt = function insertAt(x, y, item) {
    if (this.items[x] === undefined) {
        this.items[x] = [];
    }
    if (this.items[x][y] === undefined) {
        this.items[x][y] = [];
    }
    this.items[x][y].push(item);
};
BlockGridStore.prototype.removeAt = function removeAt(x, y, item) {
    var index = this.items[x][y].indexOf(item);
    if (index !== -1) {
        this.items[x][y].splice(this.items[x][y].indexOf(item), 1);
        return true;
    } else {
        console.log('Attempt to remove item from BlockGridStore that does not exist.');
        return false;
    }
};
BlockGridStore.prototype.queryAt = function queryAt(x, y) {
    if (this.items[x] !== undefined && this.items[x][y] !== undefined) {
        return this.items[x][y];
    } else {
        return this.__nothing;
    }
};

function ChunkStore(chunkWidth, chunkHeight, physics) {
    this.chunkWidth = chunkWidth;
    this.chunkHeight = chunkHeight;
    this.chunks = {};
    this.chunkList = [];
    this.__physics = physics;
}
ChunkStore.prototype.allocateChunksTouching = function allocateChunksTouching(aabb, out) {
    var x1 = aabb.x - aabb.hw;
    var x2 = aabb.x + aabb.hw;
    var y1 = aabb.y - aabb.hh;
    var y2 = aabb.y + aabb.hh;
    var minX = Math.floor(x1 / this.chunkWidth);
    var maxX = Math.floor(x2 / this.chunkWidth);
    var minY = Math.floor(y1 / this.chunkHeight);
    var maxY = Math.floor(y2 / this.chunkHeight);
    var i, j;
    for (i = minX; i <= maxX; i++) {
        for (j = minY; j <= maxY; j++) {
            if (!this.chunks[i]) {
                this.chunks[i] = {};
            }
            if (!this.chunks[i][j]) {
                this.chunks[i][j] = new Chunk(i, j);
                this.chunkList.push(this.chunks[i][j]);
            }
            if (out !== undefined) {
                out.push(this.chunks[i][j]);
            }
        }
    }
};

// FIXME -- this allocates for not-found chunks, but it might be better if it didn't have side effects
ChunkStore.prototype.overlappingChunks = function overlappingChunks(aabb) {
    var chunks = [];
    this.allocateChunksTouching(aabb, chunks);
    return chunks;
};
ChunkStore.prototype.touchesBoundary = function touchesBoundary(aabb) {
    var x1 = aabb.x - aabb.hw;
    var x2 = aabb.x + aabb.hw;
    var y1 = aabb.y - aabb.hh;
    var y2 = aabb.y + aabb.hh;
    var minX = Math.floor(x1 / this.chunkWidth);
    var maxX = Math.floor(x2 / this.chunkWidth);
    var minY = Math.floor(y1 / this.chunkHeight);
    var maxY = Math.floor(y2 / this.chunkHeight);
    return (minX !== maxX) || (minY !== maxY);
};

// World.prototype.queryStaticCollidersWith = function queryStaticCollidersWith(body) {
//     var candidates = this.staticItemsTree.queryQuadTreeSingle(body);
//     var results = candidates.map(function (pair) {
//         var candidate = null;
//         if (pair.bodyA === body) {
//             candidate = pair.bodyB;
//         } else if (pair.bodyB === body) {
//             candidate = pair.bodyA;
//         }
//         return candidate;
//     }, this)
//     .filter(function (candidate) {
//         return candidate && this.__physics.aabb.overlap(candidate.aabb(), body.aabb()) && (body.name === 'point' || !!this.preciseCollision.checkGJK(candidate, body));
//     }, this);
//     return results;
// };

World.prototype.sleepChunk = function sleepChunk(chunk) {
    var i, len, ent, body;
    if (chunk.sleeping) {
        return;
    }
    chunk.sleeping = true;

    var ids = chunk.getEntityIds();
    for (i = 0, len = ids.length; i < len; i++) {
        ent = this.entitiesById[ids[i]];
        if (ent && !ent.__ignorePhysics) {
            if (ent.__chunkData.some(function (chunk) { return !chunk.sleeping; })) {
                // if this entity is in a chunk that is awake, skip sleeping it
                continue;
            }
            body = ent.components.movable ? ent.components.movable.body : null;
            if (body) {
                this.physics.remove(body);
                ent.__ignorePhysics = true;
            }
        }
    }
    console.log('Sleeping chunk ' + chunk.getHashCode());
};

World.prototype.wakeChunk = function wakeChunk(chunk) {
    var i, len, ent, body;
    if (!chunk.sleeping) {
        return;
    }

    var ids = chunk.getEntityIds();
    for (i = 0, len = ids.length; i < len; i++) {
        ent = this.entitiesById[ids[i]];
        if (ent && ent.__ignorePhysics) {
            body = ent.components.movable ? ent.components.movable.body : null;
            if (body) {
                ent.__ignorePhysics = false;
                this.physics.add(body);
            }
        }
    }

    chunk.sleeping = false;
    console.log('Waking up chunk ' + chunk.getHashCode());
};

World.prototype.addEntityToChunk = function addEntityToChunk(entity, chunk) {
    chunk.addEntity(entity);
    var dataIndex = entity.__chunkData.indexOf(chunk);
    if (dataIndex === -1) {
        entity.__chunkData.push(chunk);
    }
};

World.prototype.removeEntityFromChunk = function removeEntityFromChunk(entity, chunk) {
    chunk.removeEntity(entity);
    var dataIndex = entity.__chunkData.indexOf(chunk);
    if (dataIndex !== -1) {
        entity.__chunkData.splice(dataIndex, 1);
    } else {
        console.log('Expected entity id ' + entity.id + ' to have chunk data on removal from chunk but it did not.');
    }
};

World.prototype.entityIsChunkable = function entityIsChunkable(entity) {
    return entity.components.movable || entity.components.placement;
};

World.prototype.updateChunksForEntity = function updateChunksForEntity(entity) {
    var i, len, index, clients, sendRemove;
    var body = entity.components.movable ? entity.components.movable.body : null;
    var placement = entity.components.placement;
    var aabb;
    if (body) {
        aabb = body.aabb();
    } else if (placement) {
        aabb = new this.__physics.aabb(0, 0, placement.position);
    } else {
        return;
    }
    var overlapping = this.chunkStore.overlappingChunks(aabb);
    var toRemove = [];
    var toAdd = overlapping.slice();
    for (i = 0, len = entity.__chunkData.length; i < len; i++) {
        index = toAdd.indexOf(entity.__chunkData[i]);
        if (index === -1) {
            // entity is leaving chunk
            toRemove.push(entity.__chunkData[i]);
        } else {
            toAdd.splice(index, 1);
        }
    }
    for (i = 0, len = toRemove.length; i < len; i++) {
        this.removeEntityFromChunk(entity, toRemove[i]);
    }
    for (i = 0, len = toAdd.length; i < len; i++) {
        this.addEntityToChunk(entity, toAdd[i]);
    }
    clients = this.clientStateManager.clients;
    for (i = 0, len = clients.length; i < len; i++) {
        clients[i].queueUpdateEntity(entity);
    }
};

World.prototype.checkEntityCrossingChunkBoundary = function checkEntityCrossingChunkBoundary(entity) {
    var body = entity.components.movable ? entity.components.movable.body : null;
    if (body) {
        return this.chunkStore.touchesBoundary(body.aabb());
    } else {
        var placement = entity.components.placement;
        if (placement) {
            return this.chunkStore.touchesBoundary(new this.__physics.aabb(0, 0, placement.position));
        }
    }
    return false;
};

World.prototype.addEntity = function addEntity(entity, multiple) {
    if (this.entitiesById[entity.id]) {
        return false;
    }
    if (!isServer && this.permanentlyRemovedEntityIdSet[entity.id]) {
        return false;
    }
    // this.entities.push(entity);
    this.entitiesById[entity.id] = entity;

    if (isServer) {
        if (entity.__chunkData === undefined) {
            entity.__chunkData = [];
        }
    }

    var movable = entity.components.movable ? entity.components.movable.body : null;
    if (movable) {
        movable.state.pos.clone(entity.components.placement.position);
        movable.state.vel.clone(entity.components.movable.velocity);
        entity.components.placement.linkPosition(movable.state.pos);
        entity.components.placement.linkOrientation(movable.state.angular);
        entity.components.movable.linkVelocity(movable.state.vel);
        if (isServer && movable.integrationMode() !== 'disabled') {
            movable.integrationMode('normal');
        }

        movable.entity(entity);

        entity.__ignorePhysics = false;
        this.physics.add(movable);

        // NOTE: this condition has to match the condition in addEntities
        if (movable.treatment === 'static') {
            var scratch = this.__physics.scratchpad();
            var block = scratch.block().set(movable.state.pos.x, movable.state.pos.y);
            this.staticItemStore.insertAt(block.x, block.y, movable);
            if (!multiple) {
                this.game.events.emit('world:geometryChanged', { added: [movable] });
            }
            scratch.done();
            // this.staticItemsTree.trackBody({ body: movable });
        } else {
            this.nonStaticEntities.push(entity);
        }
    }

    if (isServer) {
        //this.chunkStore.allocateChunksTouching(movable.aabb());
        this.updateChunksForEntity(entity);
    }

    if (isServer && !multiple) {
        var clients = this.clientStateManager.clients;
        var client;
        for (var i = 0, len = clients.length; i < len; i++) {
            client = clients[i];
            if (client.shouldGetUpdateForEntity(entity)) {
                client.socket.emit('World.addEntity', entity);
            }
        }
    }

    this.game.events.emit('addEntity', entity);
    return entity;
};

World.prototype.addEntities = function addEntities(entities) {
    var self = this;
    var added = entities.filter(function (entity) {
        return World.prototype.addEntity.call(self, entity, /* multiple: */ true);
    });
    var addedBodies = added.filter(function (ent) {
        // NOTE: this condition has to match the condition for adding to the static map in addEntity
        return (ent.components.movable && ent.components.movable.body.treatment === 'static');
    }).map(function (ent) {
        return ent.components.movable.body;
    });
    if (addedBodies.length > 0) {
        self.game.events.emit('world:geometryChanged', { added: addedBodies });
    }
};

World.prototype.setFloor = function setFloor(floorTiles) {
    this.floorTiles = floorTiles;
};

// TODO -- might be a better place to put this function
World.prototype.sendEntitiesToSocketFragmented = function sendEntitiesToSocketFragmented(socket, entities) {
    var i;
    var messageLength;
    var totalLength = entities.length;
    var sent = 0;
    while (sent < totalLength) {
        messageLength = Math.min(totalLength - sent, 20);
        socket.emit('World.addEntities', entities.slice(sent, sent + messageLength));
        sent += messageLength;
    }
};

World.prototype.removeEntities = function removeEntities(entities) {
    var self = this;
    var removed = entities.filter(function (entity) {
        return World.prototype.removeEntity.call(self, entity, /* multiple: */ true);
    });
    var removedBodies = removed.filter(function (ent) {
        // NOTE: this condition has to match the condition for adding to the static map in addEntity
        return (ent.components.movable && ent.components.movable.body.treatment === 'static');
    }).map(function (ent) {
        return ent.components.movable.body;
    });
    if (removedBodies.length > 0) {
        self.game.events.emit('world:geometryChanged', { removed: removedBodies });
    }
};

World.prototype.removeEntity = function removeEntity(entity, multiple) {
    var removed = false;
    var localEnt = this.entitiesById[entity.id];
    if (!localEnt) {
        return removed;
    }

    // var index = this.entities.indexOf(localEnt);
    // if (index === -1) {
    //     console.log('could not find entity id ' + entity.id + ' in World.entities array with equality check; trying linear search');
    //     var index = -1;
    //     this.entities.some(function (e, i) { if (e.id === entity.id) { index = i; return true; } });
    //     if (index === -1) {
    //         console.log('failed to find entity ' + entity.id);
    //         return;
    //     }
    // }

    if (isServer) {
        console.log('removing entity with id ' + entity.id);
    }
    var movable = localEnt.components.movable ? localEnt.components.movable.body : null;
    if (movable) {
        if (movable.treatment === 'static') {
            var scratch = this.__physics.scratchpad();
            var block = scratch.block().set(movable.state.pos.x, movable.state.pos.y);
            removed = !!this.staticItemStore.removeAt(block.x, block.y, movable);
            if (removed && !multiple) {
                this.game.events.emit('world:geometryChanged', { removed: [movable] });
            }
            scratch.done();
            // this.staticItemsTree.untrackBody({ body: movable });
        } else {
            var nonStaticLookupIndex = this.nonStaticEntities.indexOf(entity);
            if (nonStaticLookupIndex !== -1) {
                this.nonStaticEntities.splice(nonStaticLookupIndex, 1);
                removed = true;
            } else {
                console.log('Attempt to remove entity id ' + entity.id + ' from non-static lookup failed; entity not found.');
            }
        }

        this.physics.remove(movable);
        entity.__ignorePhysics = true; // probably not needed
    } else {
        removed = true;
    }

    if (isServer) {
        this.socket.emit('World.removeEntity', {
            id: localEnt.id,
            permanent: true
        });
    }

    this.game.events.emit('removeEntity', localEnt);

    localEnt.deconstruct();
    delete this.entitiesById[localEnt.id];
    // this.entities.splice(index, 1);
    return removed;
};

World.prototype.entityById = function entityById(id) {
    return this.entitiesById[id];
};

module.exports = World;
module.exports.$inject = ['socket', 'Game', 'system/Renderer', '$container', 'lib/physicsjs', 'ClientStateManager'];
