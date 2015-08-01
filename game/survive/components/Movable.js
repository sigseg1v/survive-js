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
MovableComponent.prototype.dependencies = ["placement"];
MovableComponent.$inject = ['lib/physicsjs'];

function MovableData(comp, physics, entity, options) {
    options = options || {};
    this.moveBehavior = null;

    this.ignoreUpdates = false;

    this.entity = entity;

    this.body = options.body ? bodies(physics, options.body) : null;
    this.bodyName = options.body;

    this._physicsControlled = options.physicsControlled;
    this._physics = physics;

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

    if (this.body) {
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
    } else {
        this.speed = 0;
    }

}
MovableData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        _physicsControlled: this._physicsControlled,
        speed: this.speed,
        _velocity: this._velocity,
        bodyName: this.bodyName
    };
};
MovableData.prototype.linkVelocity = function linkVelocity(vel) {
    this._velocity = vel;
};
MovableComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    if (initialize) {
        this.bodyName = serialized.bodyName;
        this.body = bodies(this._physics, serialized.bodyName);
        this.body.movespeed(0.0025);
        Object.defineProperty(this, 'speed', {
            get: function () { return this.body.movespeed(); },
            set: function (val) {
                val = Number(val);
                if (this.body.movespeed() !== val) {
                    this.body.movespeed(val);
                    this.component.entityDataChanged(this.entity);
                }
            }
        });
    }
    if (!this.ignoreUpdates) {
        if (initialize || !(serialized._physicsControlled)) {
            this.velocity = serialized._velocity;
        }
        this.speed = Number(serialized.speed);
    }
};

module.exports = MovableComponent;
