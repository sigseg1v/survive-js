"use strict";
var Component = require('../../engine/Component.js');

function HealableComponent() {
    Component.call(this);
    this.name = "healable";
    this.allocator = HealableData.bind({}, this);
}
HealableComponent.prototype = Object.create(Component.prototype);
HealableComponent.prototype.constructor = HealableComponent;
HealableComponent.$inject = [];

function HealableData(comp, entity, options) {
    this.injector = 'component/Healable';
    this.component = comp;
    this.options = options || {};

    this._currentHealth = this.options.currentHealth || 1;
    Object.defineProperty(this, 'currentHealth', {
        get: function () { return this._currentHealth; },
        set: function (val) {
            if (val && (this._currentHealth != val)) {
                this._currentHealth = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._maximumHealth = this.options.maximumHealth || 100;
    Object.defineProperty(this, 'maximumHealth', {
        get: function () { return this._maximumHealth; },
        set: function (val) {
            if (val && (this._maximumHealth != val)) {
                this._maximumHealth = val;
                comp.entityDataChanged(entity);
            }
        }
    });
}
HealableData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        currentHealth: this.currentHealth,
        maximumHealth: this.maximumHealth
    };
};
HealableComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._currentHealth = serialized.currentHealth;
    this._maximumHealth = serialized.maximumHealth;
};

module.exports = HealableComponent;
