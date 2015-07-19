"use strict";
var Entity = require('../../engine/Entity.js');

function EnemyEntity(container, Placement, Model, Movable, Path, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Movable, options[Movable.name]);
    this.addComponent(Path, options[Path.name]);
}
EnemyEntity.prototype = Object.create(Entity.prototype);
EnemyEntity.prototype.constructor = EnemyEntity;

module.exports = EnemyEntity;
module.exports.$inject = ['$container', 'component/Placement', 'component/Model', 'component/Movable', 'component/Path'];
