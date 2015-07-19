"use strict";
var Entity = require('../../engine/Entity.js');

function GeneratorEntity(Placement, Model, Movable, Generator, Healable, ResourceBars, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Generator, options[Generator.name]);
    this.addComponent(Healable, options[Healable.name]);
    this.addComponent(ResourceBars, options[ResourceBars.name]);
}
GeneratorEntity.prototype = Object.create(Entity.prototype);
GeneratorEntity.prototype.constructor = GeneratorEntity;

module.exports = GeneratorEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Movable', 'component/Generator', 'component/Healable', 'component/ResourceBars'];
