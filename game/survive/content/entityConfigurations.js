"use strict";

function newPlayer(container) {
    var ent = container.resolve('entity/PlayerEntity', {
        model: { name: 'player' },
        placement: { physicsControlled: true },
        movable: { body: 'Player', physicsControlled: true }
    });

    // TODO -- figure out why this doesn't sync to local player
    ent.components.lightsource.scale = 0.5;
    ent.components.melee.damage = 5;
    return ent;
}

function clientPlayer(container) {
    var ent = container.resolve('entity/PlayerEntity', {
        model: { name: 'player' },
        movable: { body: 'Player' }
    });
    ent.components.lightsource.scale = 0.5;
    return ent;
}

function wallEntity(container) {
    var ent = container.resolve('entity/WallEntity', {
        model: { name: 'wall' },
        movable: { body: 'Wall' }
    });
    return ent;
}

function genericEnemy(container) {
    var ent = container.resolve('entity/EnemyEntity', {
        model: { name: 'genericEnemy' },
        movable: { body: 'GenericEnemy' }
    });
    ent.components.health.currentHealth = 10;
    ent.components.health.maximumHealth = 10;
    ent.components.melee.damage = 1;
    return ent;
}

function register(container) {
    container.registerType('entity/PlayerEntity/newPlayer', newPlayer.bind(null, container));
    container.registerType('entity/PlayerEntity/clientPlayer', clientPlayer.bind(null, container));
    container.registerType('entity/WallEntity/wall', wallEntity.bind(null, container));
    container.registerType('entity/EnemyEntity/slime', genericEnemy.bind(null, container));
}

module.exports = {
    register: register
};
