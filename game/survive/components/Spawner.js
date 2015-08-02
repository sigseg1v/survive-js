"use strict";
var Component = require('game/engine/Component');

function SpawnerComponent() {
    Component.call(this);
    this.name = "spawner";
    this.allocator = SpawnerData.bind({}, this);
}
SpawnerComponent.prototype = Object.create(Component.prototype);
SpawnerComponent.prototype.constructor = SpawnerComponent;
SpawnerComponent.prototype.dependencies = ["placement"];
SpawnerComponent.$inject = [];

function SpawnerData(comp, entity, options) {
    options = options || {};

    this._type = options.type || 'entity/EnemyEntity/slime';
    Object.defineProperty(this, 'type', {
        get: function () { return this._type; },
        set: function (val) {
            if (val && (this._type != val)) {
                this._type = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._cooldown = options.cooldown || 5000;
    Object.defineProperty(this, 'cooldown', {
        get: function () { return this._cooldown; },
        set: function (val) {
            if (val && (this._cooldown != val)) {
                this._cooldown = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this.entityIds = {};
    this.entityCount = 0;
    this.maxEntities = options.maxEntities || 6;
}
SpawnerData.prototype.spawn = function spawn() {
    if (this.entityCount >= this.maxEntities) {
        return null;
    }
    var newEnt = require('game/inversion/container').resolve(this.type);
    newEnt.components.placement.position = this.entity.components.placement.position;
    this.entityCount++;
    this.entityIds[newEnt.id] = true;
    return newEnt;
};
SpawnerData.prototype.onEntityRemoved = function onEntityRemoved(ent) {
    if (this.entityIds.hasOwnProperty(ent.id)) {
        delete this.entityIds[ent.id];
        this.entityCount--;
    }
};
SpawnerData.prototype.toJSON = function toJSON() {
    return null;
};

module.exports = SpawnerComponent;
