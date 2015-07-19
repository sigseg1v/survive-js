function Chunk(i, j) {
    this.i = i;
    this.j = j;
    this.hashCode = "i" + i + "j" + j;
    this.entityIdSet = {};
    this.nonStaticEntityCount = 0;
    this.sleeping = false;
    this.__cachedIds = null;
}

Chunk.prototype.getHashCode = function getHashCode() {
    //return "i" + this.i + "j" + this.j;
    return this.hashCode;
};

Chunk.prototype.getEntityIds = function getEntityIDs() {
    if (this.__cachedIds === null) {
        this.__cachedIds = Object.keys(this.entityIdSet);
    }
    return this.__cachedIds;
};

Chunk.prototype.addEntity = function addEntity(entity) {
    var result = false;
    if (!this.entityIdSet[entity.id]) {
        this.entityIdSet[entity.id] = true;
        var body = entity.components.movable ? entity.components.movable.body : null;
        if (body && body.treatment !== 'static') {
            this.nonStaticEntityCount++;
        }

        this.__cachedIds = null;
        result = true;
    } else {
        console.log('Attempt to add entity id ' + entity.id + ' which already exists in chunk.');
    }
    return result;
};

Chunk.prototype.removeEntity = function removeEntity(entity) {
    var result = false;
    if (this.entityIdSet[entity.id]) {
        delete this.entityIdSet[entity.id];

        var body = entity.components.movable ? entity.components.movable.body : null;
        if (body && body.treatment !== 'static') {
            this.nonStaticEntityCount--;
        }

        this.__cachedIds = null;
    } else {
        console.log('Attempt to remove entity id ' + entity.id + ' which does not exist in chunk.');
    }
    return result;
};

module.exports = Chunk;
