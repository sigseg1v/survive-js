"use strict";
var Entity = require('../../engine/Entity.js');

function PlayerEntity(container, Placement, Model, Movable, Miner, Lightsource, Name, Use, Tracelog, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Miner, options[Miner.name]);
    this.addComponent(Lightsource, options[Lightsource.name]);
    this.addComponent(Name, options[Name.name]);
    this.addComponent(Use, options[Use.name]);
    this.addComponent(Tracelog, options[Tracelog.name]);
}
PlayerEntity.prototype = Object.create(Entity.prototype);
PlayerEntity.prototype.constructor = PlayerEntity;

module.exports = PlayerEntity;
module.exports.$inject = ['$container', 'component/Placement', 'component/Model', 'component/Movable', 'component/Miner', 'component/Lightsource', 'component/Name', 'component/Use', 'component/Tracelog'];
