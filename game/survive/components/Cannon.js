"use strict";
var Component = require('../../engine/Component.js');

function CannonComponent() {
    Component.call(this);
    this.name = "cannon";
    this.allocator = CannonData.bind({}, this);
}
CannonComponent.prototype = Object.create(Component.prototype);
CannonComponent.prototype.constructor = CannonComponent;
CannonComponent.$inject = [];

function CannonData(comp, entity, options) {
    this.injector = 'component/Cannon';
    this.component = comp;
    this.options = options || {};

    this._range = this.options.range || 3;
    Object.defineProperty(this, 'range', {
        get: function () { return this._range; },
        set: function (val) {
            if (val && (this._range != val)) {
                this._range = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._attackCost = this.options.attackCost || 4;
    Object.defineProperty(this, 'attackCost', {
        get: function () { return this._attackCost; },
        set: function (val) {
            if (val && (this._attackCost != val)) {
                this._attackCost = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._attackPower = this.options.attackPower || 4;
    Object.defineProperty(this, 'attackPower', {
        get: function () { return this._attackPower; },
        set: function (val) {
            if (val && (this._attackPower != val)) {
                this._attackPower = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._cooldown = this.options.cooldown || 700;
    Object.defineProperty(this, 'cooldown', {
        get: function () { return this._cooldown; },
        set: function (val) {
            if (val && (this._cooldown != val)) {
                this._cooldown = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this.currentTarget = null;
}
CannonData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        range: this.range,
        attackCost: this.attackCost,
        attackPower: this.attackPower,
        cooldown: this.cooldown
    };
};
CannonComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._range = serialized.range;
    this._attackCost = serialized.attackCost;
    this._attackPower = serialized.attackPower;
    this._cooldown = serialized.cooldown;
};

module.exports = CannonComponent;
