"use strict";
var limit = require('game/etc/ratelimiter');

function SpawnerCycle(container, game, Spawner, world) {
    var entityAddBuffer = [];

    game.events.on('removeEntity', onRemoveEntity);

    var runCycle_limit = limit(100, runCycle);

    this.step = function step(time) {
        runCycle_limit();
    };

    function onRemoveEntity(ent) {
        for (var i = 0, len = Spawner.entities.length; i < len; i++) {
            Spawner.entities[i].components.spawner.onEntityRemoved(ent);
        }
    }

    function runCycle() {
        var entities = Spawner.entities;
        var spawnerData;
        for (var i = 0, len = entities.length; i < len; i++) {
            spawnerData = entities[i].components.spawner;
            limit.byCooldown(spawnerData, spawn, [spawnerData]);
        }
        if (entityAddBuffer.length > 0) {
            world.addEntities(entityAddBuffer);
            while (entityAddBuffer.length !== 0) {
                entityAddBuffer.pop();
            }
        }
    }

    function spawn(spawnerData) {
        var newEnt = spawnerData.spawn();
        if (newEnt) {
            entityAddBuffer.push(newEnt);
        }
    }
}

module.exports = SpawnerCycle;
module.exports.$inject = ['$container', 'Game', 'component/Spawner', 'World'];
