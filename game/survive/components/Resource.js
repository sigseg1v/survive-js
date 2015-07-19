"use strict";
var Component = require('../../engine/Component.js');

var resourceTypes = {
    ROCK: 0,
    RED: 1,
    BLUE: 2,
    GREEN: 3,
    PURPLE: 4
};

function ResourceComponent() {
    Component.call(this);
    this.name = "resource";
    this.allocator = ResourceData.bind({}, this);
}
ResourceComponent.prototype = Object.create(Component.prototype);
ResourceComponent.prototype.constructor = ResourceComponent;
ResourceComponent.$inject = [];

ResourceComponent.prototype.ResourceType = resourceTypes;

function ResourceData(comp, entity, options) {
    this.injector = 'component/Resource';
    this.component = comp;
    this.options = options || {};

    this._amount = this.options.amount || 1000;
    Object.defineProperty(this, 'amount', {
        get: function () { return this._amount; },
        set: function (val) {
            if (val !== undefined && (this._amount != val)) {
                this._amount = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this.type = this.options.type || ResourceData.prototype.ResourceType.ROCK;
}
ResourceData.prototype.ResourceType = resourceTypes;
ResourceData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        type: this.type,
        amount: this.amount
    };
};
ResourceComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this.type = serialized.type;
    this._amount = serialized.amount;
};

module.exports = ResourceComponent;
