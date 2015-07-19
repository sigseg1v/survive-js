"use strict";
var Entity = require('../../engine/Entity.js');

function EnemyEntity(container, Placement, Model, Movable, Healable, Path, Melee, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Healable, options[Healable.name]);
    this.addComponent(Path, options[Path.name]);
    this.addComponent(Melee, options[Melee.name]);
}
EnemyEntity.prototype = Object.create(Entity.prototype);
EnemyEntity.prototype.constructor = EnemyEntity;

module.exports = EnemyEntity;
module.exports.$inject = ['$container', 'component/Placement', 'component/Model', 'component/Movable', 'component/Healable', 'component/Path', 'component/Melee'];
