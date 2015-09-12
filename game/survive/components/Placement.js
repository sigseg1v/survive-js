"use strict";
var Component = require('game/engine/Component');

function PlacementComponent(game, physics) {
    Component.call(this);
    this.name = "placement";
    this.allocator = PlacementData.bind({}, this, game, physics);
}
PlacementComponent.prototype = Object.create(Component.prototype);
PlacementComponent.prototype.constructor = PlacementComponent;
PlacementComponent.$inject = ['Game', 'lib/physicsjs'];

function PlacementData(comp, game, physics, entity, options) {
    options = options || {};
    this.entity = entity;

    this.ignoreUpdates = false;

    this._physicsControlled = options.physicsControlled;

    this._position = new physics.vector(0, 0);
    Object.defineProperty(this, 'position', {
        get: function () { return this._position; },
        set: function (val) {
            if (val && !(this._position.x == val.x && this._position.y == val.y)) {
                this._position.clone(val);
                comp.entityDataChanged(entity);
            }
        }
    });

    this._orientation = 0;
    Object.defineProperty(this, 'orientation', {
        configurable: true,
        get: function () { return this._orientation; },
        set: function (val) {
            if (Number.isNaN(val)) return;
            if (this._orientation !== val) {
                this._orientation = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    // amount of time (in milliseconds) it takes to turn 180 degrees
    this._orientationSmoothing = options.orientationSmoothing || 0;
    Object.defineProperty(this, 'orientationSmoothing', {
        configurable: true,
        get: function () { return this._orientationSmoothing; },
        set: function (val) {
            if (Number.isNaN(val)) return;
            if (this._orientationSmoothing !== val) {
                this._orientationSmoothing = val;
                comp.entityDataChanged(entity);
            }
        }
    });
}
PlacementData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        _position: this._position,
        _physicsControlled: this._physicsControlled,
        orientation: this.orientation,
        orientationSmoothing: this.orientationSmoothing
    };
};
PlacementData.prototype.linkPosition = function linkPosition(pos) {
    this._position = pos;
};
PlacementData.prototype.linkOrientation = function linkOrientation(angular) {
    Object.defineProperty(this, 'orientation', {
        configurable: true,
        get: function () { return angular.pos; },
        set: function (val) {
            if (Number.isNaN(val)) return;
            if (angular.pos !== val) {
                angular.pos = val;
                this.component.entityDataChanged(this.entity);
            }
        }
    });
};
PlacementComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    if (!this.ignoreUpdates) {
        if (initialize || !(serialized._physicsControlled)) {
            this._position.clone(serialized._position);
            this.orientation = serialized.orientation;
            this.orientationSmoothing = serialized.orientationSmoothing;
        }
    }
};

module.exports = PlacementComponent;
