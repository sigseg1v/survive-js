"use strict";
var Entity = require('game/engine/Entity');

function SpawnerEntity(container, Placement, Spawner, options) {
    Entity.call(this);
    this.addComponents([Placement, Spawner], options);
}
SpawnerEntity.prototype = Object.create(Entity.prototype);
SpawnerEntity.prototype.constructor = SpawnerEntity;

module.exports = SpawnerEntity;
module.exports.$inject = ['$container', 'component/Placement', 'component/Spawner'];
