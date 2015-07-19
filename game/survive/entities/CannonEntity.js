"use strict";
var Entity = require('../../engine/Entity.js');

function CannonEntity(Placement, Model, Movable, Chargeable, Cannon, Healable, ResourceBars, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Chargeable, options[Chargeable.name]);
    this.addComponent(Cannon, options[Cannon.name]);
    this.addComponent(Healable, options[Healable.name]);
    this.addComponent(ResourceBars, options[ResourceBars.name]);
}
CannonEntity.prototype = Object.create(Entity.prototype);
CannonEntity.prototype.constructor = CannonEntity;

module.exports = CannonEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Movable', 'component/Chargeable', 'component/Cannon', 'component/Healable', 'component/ResourceBars'];
