"use strict";
var Component = require('game/engine/Component');

function RangedAttackComponent() {
    Component.call(this);
    this.name = "rangedAttack";
    this.allocator = RangedAttackData.bind({}, this);
}
RangedAttackComponent.prototype = Object.create(Component.prototype);
RangedAttackComponent.prototype.constructor = RangedAttackComponent;
RangedAttackComponent.$inject = [];

function RangedAttackData(comp, entity, options) {
    this.injector = 'component/RangedAttack';
    this.component = comp;
    this.options = options || {};

    this._damage = this.options.damage || 1;
    Object.defineProperty(this, 'damage', {
        get: function () { return this._damage; },
        set: function (val) {
            if (val && (this._damage != val)) {
                this._damage = val;
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
RangedAttackData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        damage: this.damage,
        cooldown: this.cooldown
    };
};
RangedAttackComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._damage = serialized.damage;
    this._cooldown = serialized.cooldown;
};

module.exports = RangedAttackComponent;
