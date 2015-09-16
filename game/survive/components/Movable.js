"use strict";
var isServer = typeof window === 'undefined';
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

    var loadedBody = bodies(physics, options.body);
    this.body = loadedBody ? loadedBody.body : null;
    this.hitbox = loadedBody ? loadedBody.hitbox : null;
    this.bodyName = options.body;

    this.physicsControlled = options.physicsControlled;
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
        this.body.labels = entity.labels;
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

    if (this.hitbox) {
        this.hitbox.state.pos = entity.components.placement.position;
    }
}
MovableData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        speed: this.speed,
        _velocity: this._velocity,
        bodyName: this.bodyName
    };
};
MovableData.prototype.linkVelocity = function linkVelocity(vel) {
    this._velocity = vel;
};
MovableData.prototype.finishComposition = function finishComposition(entity) {
    this.body.state.pos.clone(entity.components.placement.position);
    this.body.state.vel.clone(this.velocity);
    entity.components.placement.linkPosition(this.body.state.pos);
    if (!this.body.fixedOrientation()) {
        entity.components.placement.linkOrientation(this.body.state.angular);
    }
    this.linkVelocity(this.body.state.vel);

    this.body.entity(entity);

    if (this.hitbox) {
        this.hitbox.state.pos = entity.components.placement.position;
        this.hitbox.entity(entity);
    }

    if (isServer && this.body.integrationMode() !== 'disabled') {
        this.body.integrationMode('normal');
    }
};
MovableComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    if (initialize) {
        this.bodyName = serialized.bodyName;
        var loadedBody = bodies(this._physics, serialized.bodyName);
        this.body = loadedBody.body;
        if (this.body) {
            this.body.entity(this.entity);
        }
        this.hitbox = loadedBody.hitbox;
        if (this.hitbox) {
            this.hitbox.entity(this.entity);
        }
        this.body.labels = this.entity.labels;
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
        if (initialize || !(this.physicsControlled)) {
            this.velocity = serialized._velocity;
        }
        this.speed = Number(serialized.speed);
    }
};

module.exports = MovableComponent;
