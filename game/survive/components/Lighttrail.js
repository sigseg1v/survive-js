"use strict";
var Component = require('game/engine/Component');
var isServer = typeof window === 'undefined';

function LighttrailComponent() {
    Component.call(this);

    this.name = "lighttrail";
    this.allocator = LighttrailData.bind({}, this);
}
LighttrailComponent.prototype = Object.create(Component.prototype);
LighttrailComponent.prototype.constructor = LighttrailComponent;
LighttrailComponent.prototype.dependencies = ["placement"];
LighttrailComponent.$inject = [ ];

function LighttrailData(comp, entity, options) {
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

    Object.defineProperty(this, 'cooldown', {
        get: function () { return this._cooldown; },
        set: function (val) {
            if (this._cooldown !== val) {
                this._cooldown = val;
                comp.entityDataChanged(entity);
            }
        }
    });
    this._cooldown = options.cooldown || 300;

    Object.defineProperty(this, 'duration', {
        get: function () { return this._duration; },
        set: function (val) {
            if (this._duration !== val) {
                this._duration = val;
                comp.entityDataChanged(entity);
            }
        }
    });
    this._duration = options.duration || 3000;

    Object.defineProperty(this, 'intensity', {
        get: function () { return this._intensity; },
        set: function (val) {
            if (this._intensity !== val) {
                this._intensity = val;
                comp.entityDataChanged(entity);
            }
        }
    });
    this._intensity = options.intensity || 0.2;
}
LighttrailData.prototype.toJSON = function toJSON() {
    return null;
};

module.exports = LighttrailComponent;
