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
}
SpawnerData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        type: this.type,
        cooldown: this.cooldown
    };
};
SpawnerComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._type = serialized.type;
    this._cooldown = serialized.cooldown;
};

module.exports = SpawnerComponent;
