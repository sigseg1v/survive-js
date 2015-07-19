"use strict";
var Entity = require('../../engine/Entity.js');

function WallEntity(Placement, Model, Movable, Resource, ResourceBars, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Resource, options[Resource.name]);
    this.addComponent(ResourceBars, options[ResourceBars.name]);
}
WallEntity.prototype = Object.create(Entity.prototype);
WallEntity.prototype.constructor = WallEntity;

module.exports = WallEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Movable', 'component/Resource', 'component/ResourceBars'];
