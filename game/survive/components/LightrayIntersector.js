"use strict";
var Component = require('game/engine/Component');

function LightrayIntersectorComponent() {
    Component.call(this);
    this.name = "lightrayIntersector";
    this.allocator = LightrayIntersectorData.bind({}, this);
}
LightrayIntersectorComponent.prototype = Object.create(Component.prototype);
LightrayIntersectorComponent.prototype.constructor = LightrayIntersectorComponent;
LightrayIntersectorComponent.prototype.dependencies = ["placement", "movable"];
LightrayIntersectorComponent.$inject = [];

function LightrayIntersectorData(comp, options) {
    options = options || {};
}
LightrayIntersectorData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector
    };
};

module.exports = LightrayIntersectorComponent;
