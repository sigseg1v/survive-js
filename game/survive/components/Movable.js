"use strict";
var Component = require('game/engine/Component');
var bodies = require('game/survive/content/bodies');

function MovableComponent(physics) {
    Component.call(this);
    this.name = "movable";
    this.allocator = MovableData.bind({}, this, physics);
}
MovableComponent.prototype = Object.create(Component.prototype);
MovableComponent.prototype.constructor = MovableComponent;
MovableComponent.$inject = ['lib/physicsjs'];

function MovableData(comp, physics, entity, options) {
    this.injector = 'component/Movable';
    this.component = comp;
    this.options = options || {};
    this.moveBehavior = null;

    this.ignoreUpdates = false;

    this.body = bodies(physics, this.options.body);

    this._velocity = new physics.vector();
    Object.defineProperty(this, 'velocity', {
        get: function () { return this._velocity; },
        set: function (val) {
            if (val && !(val.x == this._velocity.x && val.y == this._velocity.y)) {
                this._velocity.clone(val);
                comp.entityDataChanged(entity);
            }
        }
    });

    this.body.movespeed(0.0025);
    Object.defineProperty(this, 'speed', {
        get: function () { return this.body.movespeed(); },
        set: function (val) {
            val = Number(val);
            if (this.body.movespeed() !== val) {
                this.body.movespeed(val);
                comp.entityDataChanged(entity);
            }
        }
    });
}
MovableData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        speed: this.speed,
        _velocity: this._velocity
    };
};
MovableData.prototype.linkVelocity = function linkVelocity(vel) {
    this._velocity = vel;
};
MovableComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    if (!this.ignoreUpdates) {
        if (initialize || !(serialized.options && serialized.options.physicsControlled)) {
            this.velocity = serialized._velocity;
        }
        this.speed = Number(serialized.speed);
    }
};

module.exports = MovableComponent;
