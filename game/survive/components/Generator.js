"use strict";
var Component = require('../../engine/Component.js');

function GeneratorComponent() {
    Component.call(this);
    this.name = "generator";
    this.allocator = GeneratorData.bind({}, this);
}
GeneratorComponent.prototype = Object.create(Component.prototype);
GeneratorComponent.prototype.constructor = GeneratorComponent;
GeneratorComponent.$inject = [];

function GeneratorData(comp, entity, options) {
    this.injector = 'component/Generator';
    this.component = comp;
    this.options = options || {};

    this._range = this.options.range || 10;
    Object.defineProperty(this, 'range', {
        get: function () { return this._range; },
        set: function (val) {
            if (val && (this._range != val)) {
                this._range = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._chargeAmount = this.options.chargeAmount || 10;
    Object.defineProperty(this, 'chargeAmount', {
        get: function () { return this._chargeAmount; },
        set: function (val) {
            if (val && (this._chargeAmount != val)) {
                this._chargeAmount = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._cooldown = this.options.cooldown || 1000;
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
GeneratorData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        range: this.range,
        chargeAmount: this.chargeAmount,
        cooldown: this.cooldown
    };
};
GeneratorComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._range = serialized.range;
    this._chargeAmount = serialized.chargeAmount;
    this._cooldown = serialized.cooldown;
};

module.exports = GeneratorComponent;
