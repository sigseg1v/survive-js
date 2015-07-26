"use strict";
var Component = require('game/engine/Component');

function MeleeComponent() {
    Component.call(this);
    this.name = "melee";
    this.allocator = MeleeData.bind({}, this);
}
MeleeComponent.prototype = Object.create(Component.prototype);
MeleeComponent.prototype.constructor = MeleeComponent;
MeleeComponent.$inject = [];

function MeleeData(comp, entity, options) {
    this.injector = 'component/Melee';
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
MeleeData.prototype.globalCooldown = 200;
MeleeData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        damage: this.damage,
        cooldown: this.cooldown
    };
};
MeleeComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._damage = serialized.damage;
    this._cooldown = serialized.cooldown;
};

module.exports = MeleeComponent;
