"use strict";
var weakmap = require('weakmap');
var constants = require('game/survive/game/SharedConstants');

var playerEntityList = new weakmap();
var playerDataMap = new weakmap();

function trackEntityUnderPlayer(player, entity) {
    if (!playerEntityList.has(player)) {
        playerEntityList.set(player, []);
    }
    playerEntityList.get(player).push(entity);
}
function removeEntityUnderPlayer(player, entity) {
    if (playerEntityList.has(player)) {
        var list = playerEntityList.get(player);
        var index = list.indexOf(entity);
        if (index !== -1) {
            list.splice(index, 1);
        }
    }
}

function PlayerData() {
    this.weapon = constants.weapons.MELEE.id;
}
PlayerData.prototype.toJSON = function () {
    return {
        weapon: this.weapon
    };
};

function PlayerStateServer(stateManager) {
    var self = this;

    self.getPlayerChildEntities = function getPlayerChildEntities(player) {
        return playerEntityList.has(player) ? playerEntityList.get(player) : [];
    };

    self.dataFor = function dataFor(player) {
        if (!playerDataMap.has(player)) {
            playerDataMap.set(player, new PlayerData());
        }
        return playerDataMap.get(player);
    };

    self.sendDataTo = function sendDataTo(player) {
        var data = self.dataFor(player);
        var state = stateManager.getClientStateForPlayer(player);
        if (data && state) {
            state.socket.emit('playerState:update', data);
        }
    };
}

module.exports = PlayerStateServer;
module.exports.$inject = ['ClientStateManager'];
