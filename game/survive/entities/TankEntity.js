"use strict";
var Entity = require('../../engine/Entity.js');

function TankEntity(Placement, Model, Movable, Healable, ResourceBars, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Healable, options[Healable.name]);
    this.addComponent(ResourceBars, options[ResourceBars.name]);
}
TankEntity.prototype = Object.create(Entity.prototype);
TankEntity.prototype.constructor = TankEntity;

module.exports = TankEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Movable', 'component/Healable', 'component/ResourceBars'];
