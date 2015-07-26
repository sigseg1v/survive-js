"use strict";
var Entity = require('game/engine/Entity');

function WallEntity(Placement, Model, Movable, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
}
WallEntity.prototype = Object.create(Entity.prototype);
WallEntity.prototype.constructor = WallEntity;

module.exports = WallEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Movable'];
