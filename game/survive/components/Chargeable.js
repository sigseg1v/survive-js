"use strict";
var Component = require('../../engine/Component.js');

function ChargeableComponent() {
    Component.call(this);
    this.name = "chargeable";
    this.allocator = ChargeableData.bind({}, this);
}
ChargeableComponent.prototype = Object.create(Component.prototype);
ChargeableComponent.prototype.constructor = ChargeableComponent;
ChargeableComponent.$inject = [];

function ChargeableData(comp, entity, options) {
    this.injector = 'component/Chargeable';
    this.component = comp;
    this.options = options || {};

    this._currentEnergy = this.options.currentEnergy || 0;
    Object.defineProperty(this, 'currentEnergy', {
        get: function () { return this._currentEnergy; },
        set: function (val) {
            if (val && (this._currentEnergy != val)) {
                this._currentEnergy = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._maximumEnergy = this.options.maximumEnergy || 200;
    Object.defineProperty(this, 'maximumEnergy', {
        get: function () { return this._maximumEnergy; },
        set: function (val) {
            if (val && (this._maximumEnergy != val)) {
                this._maximumEnergy = val;
                comp.entityDataChanged(entity);
            }
        }
    });
}
ChargeableData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        currentEnergy: this.currentEnergy,
        maximumEnergy: this.maximumEnergy
    };
};
ChargeableComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._currentEnergy = serialized.currentEnergy;
    this._maximumEnergy = serialized.maximumEnergy;
};

module.exports = ChargeableComponent;
