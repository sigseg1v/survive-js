"use strict";
var Entity = require('game/engine/Entity');

function WallEntity(Placement, Model, Movable, LightrayIntersector, options) {
    Entity.call(this);
    this.labels = ['wall', 'destroyable'];
    this.addComponents([Placement, Model, Movable, LightrayIntersector], options);
}
WallEntity.prototype = Object.create(Entity.prototype);
WallEntity.prototype.constructor = WallEntity;

module.exports = WallEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Movable', 'component/LightrayIntersector'];
