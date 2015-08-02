"use strict";
var Entity = require('game/engine/Entity');

function EnemyEntity(container, Placement, Model, Movable, Path, Health, Melee, Aggro, options) {
    Entity.call(this);
    this.labels = ['enemy'];
    this.addComponents([Placement, Model, Movable, Path, Health, Melee, Aggro], options);
}
EnemyEntity.prototype = Object.create(Entity.prototype);
EnemyEntity.prototype.constructor = EnemyEntity;

module.exports = EnemyEntity;
module.exports.$inject = ['$container', 'component/Placement', 'component/Model', 'component/Movable', 'component/Path', 'component/Health', 'component/Melee', 'component/Aggro'];
