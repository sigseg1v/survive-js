"use strict";
var Component = require('game/engine/Component');

function FollowComponent(physics) {
    Component.call(this);
    this.name = "follow";
    this.allocator = FollowData.bind({}, this, physics);
}
FollowComponent.prototype = Object.create(Component.prototype);
FollowComponent.prototype.constructor = FollowComponent;
FollowComponent.$inject = ['lib/physicsjs'];

function FollowData(comp, physics, entity, options) {
    this.injector = 'component/Follow';
    this.component = comp;
    this.options = options || {};

    this._offset = new physics.vector(0, 0);
    Object.defineProperty(this, 'offset', {
        get: function () { return this._offset; },
        set: function (val) {
            if (val && !(this._offset.x == val.x && this._offset.y == val.y)) {
                this._offset.clone(val);
                comp.entityDataChanged(entity);
            }
        }
    });

    this.snap = this.options.snap;

    if (this.options.offset) {
        this.offset = this.options.offset;
    }
    this.targetId = this.options.targetId || null;
}
FollowData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        offset: this._offset,
        targetId: this.targetId
    };
};
FollowComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this.offset = serialized.offset;
    this.targetId = serialized.targetId;
};

module.exports = FollowComponent;
