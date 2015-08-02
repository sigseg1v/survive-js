"use strict";
var Component = require('game/engine/Component');

function AggroComponent() {
    Component.call(this);
    this.name = "aggro";
    this.allocator = AggroData.bind({}, this);
}
AggroComponent.prototype = Object.create(Component.prototype);
AggroComponent.prototype.constructor = AggroComponent;
AggroComponent.prototype.dependencies = ["placement", "path"];
AggroComponent.$inject = [];

function AggroData(comp, entity, options) {
    options = options || {};

    this._radius = options.radius || 6;
    Object.defineProperty(this, 'radius', {
        get: function () { return this._radius; },
        set: function (raw) {
            var val = Number(raw);
            if (this._radius != val) {
                this._radius = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this._targetLabels = options.targetLabels || [];
    Object.defineProperty(this, 'targetLabels', {
        get: function () { return this._targetLabels; },
        set: function (val) {
            if (this._targetLabels !== val) {
                while (this._targetLabels.length > 0) {
                    this._targetLabels.pop();
                }
                this._targetLabels.push.apply(this._targetLabels, val);
                comp.entityDataChanged(entity);
            }
        }
    });
}
AggroData.prototype.toJSON = function toJSON() {
    return null;
};

module.exports = AggroComponent;
