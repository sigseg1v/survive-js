"use strict";
var Entity = require('game/engine/Entity');

function PlayerEntity(container, Placement, Model, Movable, Lightsource, Name, Use, Melee, RangedAttack, options) {
    Entity.call(this);
    this.labels = ['player'];
    this.addComponents([Placement, Model, Movable, Lightsource, Name, Use, Melee, RangedAttack], options);
}
PlayerEntity.prototype = Object.create(Entity.prototype);
PlayerEntity.prototype.constructor = PlayerEntity;

module.exports = PlayerEntity;
module.exports.$inject = ['$container', 'component/Placement', 'component/Model', 'component/Movable', 'component/Lightsource', 'component/Name', 'component/Use', 'component/Melee', 'component/RangedAttack'];
