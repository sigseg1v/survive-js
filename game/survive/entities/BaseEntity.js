"use strict";
var Entity = require('../../engine/Entity.js');

function BaseEntity(Base, Placement, Model, Movable, Healable, ResourceBars, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Base, options[Base.name]);
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Healable, options[Healable.name]);
    this.addComponent(ResourceBars, options[ResourceBars.name]);
}
BaseEntity.prototype = Object.create(Entity.prototype);
BaseEntity.prototype.constructor = BaseEntity;

module.exports = BaseEntity;
module.exports.$inject = ['component/Base', 'component/Placement', 'component/Model', 'component/Movable', 'component/Healable', 'component/ResourceBars'];
