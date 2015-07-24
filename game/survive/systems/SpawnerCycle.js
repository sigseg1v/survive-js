"use strict";
var limit = require('../../etc/ratelimiter.js');

function SpawnerCycle(container, Spawner, world) {
    var entityAddBuffer = [];

    var runCycle_limit = limit(100, runCycle);

    this.step = function step(time) {
        runCycle_limit();
    };

    function runCycle() {
        var entities = Spawner.entities;
        for (var i = 0, len = entities.length; i < len; i++) {
            limit.byCooldown(entities[i].components.spawner, spawn, [entities[i]]);
        }
        if (entityAddBuffer.length > 0) {
            world.addEntities(entityAddBuffer);
            while (entityAddBuffer.length !== 0) {
                entityAddBuffer.pop();
            }
        }
    }

    function spawn(entity) {
        var newEnt = container.resolve(entity.components.spawner.type);
        newEnt.components.placement.position = entity.components.placement.position;
        entityAddBuffer.push(newEnt);
    }
}

module.exports = SpawnerCycle;
module.exports.$inject = ['$container', 'component/Spawner', 'World'];
