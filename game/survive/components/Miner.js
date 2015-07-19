"use strict";
var Component = require('../../engine/Component.js');

function MinerComponent() {
    Component.call(this);
    this.name = "miner";
    this.allocator = MinerData.bind({}, this);
}
MinerComponent.prototype = Object.create(Component.prototype);
MinerComponent.prototype.constructor = MinerComponent;
MinerComponent.$inject = [];

function MinerData(comp, entity, options) {
    this.injector = 'component/Miner';
    this.component = comp;
    this.entity = entity;
    this.options = options || {};

    this._rate = this.options.rate || 5;
    Object.defineProperty(this, 'rate', {
        get: function () { return this._rate; },
        set: function (val) {
            if (val && (this._rate != val)) {
                this._rate = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this.resources = {};
}
MinerData.prototype.cooldown = 1000;
MinerData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        rate: this.rate,
        resources: this.resources
    };
};
MinerData.prototype.setResource = function setResource(type, amount) {
    this.resources[type] = amount;
    this.component.entityDataChanged(this.entity);
};
MinerData.prototype.addResource = function addResource(type, amount) {
    this.resources[type] = (this.resources[type] || 0) + amount;
    this.component.entityDataChanged(this.entity);
};
MinerData.prototype.getResource = function getResource(type) {
    return this.resources[type] || 0;
};

MinerComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._rate = serialized.rate;
    if (serialized.resources) {
        Object.keys(serialized.resources).forEach(function (k) {
            this.resources[k] = serialized.resources[k];
        }, this);
    }
};

module.exports = MinerComponent;
