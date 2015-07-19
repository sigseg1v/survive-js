var container = require('../inversion/container.js');

function ClientStateManager() {
    var self = this;
    self.idStateMap = {};
    self.clients = [];
}
ClientStateManager.prototype.getClientState = function getClientState(socket) {
    return this.idStateMap[socket.id.toString()];
};
ClientStateManager.prototype.getClientStateBySocketId = function getClientStateBySocketId(id) {
    return this.idStateMap[id];
};
ClientStateManager.prototype.addClient = function addClient(socket) {
    if (this.idStateMap[socket.id.toString()]) {
        console.log('Attempt to add client that is already tracked.');
        return;
    }
    var state = new ClientState();
    state.socket = socket;
    this.idStateMap[socket.id.toString()] = state;
    this.clients.push(state);
};
ClientStateManager.prototype.removeClient = function removeClient(socket) {
    if (!this.idStateMap[socket.id.toString()]) {
        console.log('Attempt to remove client that is not being tracked.');
        return;
    }
    delete this.idStateMap[socket.id.toString()];
    this.clients.splice(this.clients.indexOf(this.idStateMap[socket.id.toString()]), 1);
};
ClientStateManager.prototype.getAllPlayers = function getAllPlayers() {
    return Object.keys(this.idStateMap).map(function (key) {
        return this.idStateMap[key].player;
    }, this);
};

function ClientState() {
    this.chunkIdMap = {};
    this.socket = null;
    this.player = null;
    this.entityIdsToUpdate = {};
}
ClientState.prototype.chunkMapToNetwork = function chunkMapToNetwork() {
    var obj = {};
    Object.keys(this.chunkIdMap).forEach(function (key) {
        obj[key] = true;
    });
    return obj;
};
ClientState.prototype.queueUpdateEntity = function queueUpdateEntity(entity) {
    this.entityIdsToUpdate[entity.id] = true;
};
ClientState.prototype.getAndClearEntityIdsToUpdate = function getAndClearEntityIdsToUpdate() {
    var ids = Object.keys(this.entityIdsToUpdate);
    this.entityIdsToUpdate = {};
    return ids;
};
ClientState.prototype.shouldGetUpdateForEntity = function shouldGetUpdateForEntity(entity) {
    if (container.resolve('World').entityIsChunkable(entity)) {
        for (var i = 0, len = entity.__chunkData.length; i < len; i++) {
            if (this.chunkIdMap[entity.__chunkData[i].getHashCode()]) {
                return true;
            }
        }
        return false;
    } else {
        return true;
    }
};
ClientState.prototype.getLoadedChunks = function getLoadedChunks() {
    return Object.keys(this.chunkIdMap).map(function (key) {
        return this.chunkIdMap[key];
    }, this);
};

module.exports = ClientStateManager;
