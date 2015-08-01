"use strict";
var Component = require('game/engine/Component');
var isServer = typeof window === 'undefined';

function LightsourceComponent() {
    Component.call(this);

    this.name = "lightsource";
    this.allocator = LightsourceData.bind({}, this);
}
LightsourceComponent.prototype = Object.create(Component.prototype);
LightsourceComponent.prototype.constructor = LightsourceComponent;
LightsourceComponent.prototype.dependencies = ["placement"];
LightsourceComponent.$inject = [ ];

function LightsourceData(comp, entity, options) {
    options = options || {};
    this.sprite = null;

    Object.defineProperty(this, 'scale', {
        get: function () { return this._scale; },
        set: function (val) {
            if (this._scale !== val) {
                this._scale = val;
                comp.entityDataChanged(entity);
            }
        }
    });
    this._scale = options.scale || 1;
}
LightsourceData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        scale: this.scale
    };
};
LightsourceComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this.scale = serialized.scale;
};

module.exports = LightsourceComponent;
