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
    this.pendingActions = [];
}
PlayerData.prototype.toJSON = function () {
    return {
        weapon: this.weapon,
        pendingActions: this.pendingActions
    };
};

function DeferredAction(playerData, startFunction, completionFunction, cancellationFunction, minimumCastTime) {
    if (!completionFunction) {
        throw 'DeferredAction requires a completion function.';
    }
    if (!playerData) {
        throw 'DeferredAction must be attached to player data.';
    }
    this.uniqueId = DeferredAction.prototype.idCounter++;
    this.playerData = playerData;
    this.startFunction = startFunction;
    this.completionFunction = completionFunction;
    this.cancellationFunction = cancellationFunction;
    this.minimumCastTime = minimumCastTime || 0;
    this.started = null;
}
DeferredAction.prototype.toJSON = function () {
    return {
        uniqueId: this.uniqueId,
        minimumCastTime: this.minimumCastTime
    };
};
DeferredAction.prototype.idCounter = 0;
DeferredAction.prototype.start = function start() {
    this.playerData.pendingActions.push(this);
    this.started = Number(new Date());
    this.startFunction.apply(this, arguments);
    return this;
};
DeferredAction.prototype.complete = function complete() {
    if (!this.started || Number(new Date()) < this.started + this.mimimumCastTime) {
        return false;
    }
    this.completionFunction.apply(this, arguments);
    var index = this.playerData.pendingActions.indexOf(this);
    if (index !== -1) {
        this.playerData.pendingActions.splice(index, 1);
    }
    return true;
};
DeferredAction.prototype.cancel = function cancel() {
    this.cancellationFunction.apply(this, arguments);
    var index = this.playerData.pendingActions.indexOf(this);
    if (index !== -1) {
        this.playerData.pendingActions.splice(index, 1);
    }
    return true;
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

    self.cancelPendingActions = function cancelPendingActions(player) {
        var data = self.dataFor(player);
        while (data.pendingActions.length !== 0) {
            data.pendingActions.pop().cancel();
        }
    };

    self.startAction = function startAction(player, startFunction, completeFunction, cancelFunction, castTime) {
        var data = self.dataFor(player);
        var action = new DeferredAction(data, startFunction, completeFunction, cancelFunction, castTime);
        action.start();
        return action;
    };

    self.findActionById = function findActionById(player, id) {
        var data = self.dataFor(player);
        var action = null;
        for (var i = 0, len = data.pendingActions.length; i < len; i++) {
            if (data.pendingActions[i].uniqueId === id) {
                action = data.pendingActions[i];
                break;
            }
        }
        return action;
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
