"use strict";
var Entity = require('../../engine/Entity.js');

function HealerEntity(Placement, Model, Movable, Chargeable, Healer, Healable, ResourceBars, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Chargeable, options[Chargeable.name]);
    this.addComponent(Healer, options[Healer.name]);
    this.addComponent(Healable, options[Healable.name]);
    this.addComponent(ResourceBars, options[ResourceBars.name]);
}
HealerEntity.prototype = Object.create(Entity.prototype);
HealerEntity.prototype.constructor = HealerEntity;

module.exports = HealerEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Movable', 'component/Chargeable', 'component/Healer', 'component/Healable', 'component/ResourceBars'];
