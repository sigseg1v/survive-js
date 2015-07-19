"use strict";
var Component = require('../../engine/Component.js');

function HealerComponent() {
    Component.call(this);
    this.name = "healer";
    this.allocator = HealerData.bind({}, this);
}
HealerComponent.prototype = Object.create(Component.prototype);
HealerComponent.prototype.constructor = HealerComponent;
HealerComponent.$inject = [];

function HealerData(comp, entity, options) {
    this.injector = 'component/Healer';
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

    this._healCost = this.options.healCost || 4;
    Object.defineProperty(this, 'healCost', {
        get: function () { return this._healCost; },
        set: function (val) {
            if (val && (this._healCost != val)) {
                this._healCost = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._efficiency = this.options.efficiency || 2;
    Object.defineProperty(this, 'efficiency', {
        get: function () { return this._efficiency; },
        set: function (val) {
            if (val && (this._efficiency != val)) {
                this._efficiency = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._cooldown = this.options.cooldown || 500;
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
HealerData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        range: this.range,
        healCost: this.healCost,
        efficiency: this.efficiency,
        cooldown: this.cooldown
    };
};
HealerComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._range = serialized.range;
    this._healCost = serialized.healCost;
    this._efficiency = serialized.efficiency;
    this._cooldown = serialized.cooldown;
};

module.exports = HealerComponent;
