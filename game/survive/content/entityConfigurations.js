"use strict";

function newPlayer(container) {
    var ent = container.resolve('entity/PlayerEntity', {
        model: { name: 'player' },
        placement: { physicsControlled: true },
        movable: { body: 'Player', physicsControlled: true }
    });

    // TODO -- figure out why this doesn't sync to local player
    ent.components.lightsource.scale = 0.5;
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
    ent.components.resource.type = ent.components.resource.ResourceType.ROCK;
    ent.components.resource.amount = 5;
    return ent;
}

function baseEntity(container) {
    var ent = container.resolve('entity/BaseEntity', {
        model: { name: 'base' },
        movable: { body: 'Base' }
    });
    ent.components.healable.currentHealth = 100;
    ent.components.healable.maximumHealth = 250;
    return ent;
}

function tankEntity(container) {
    var ent = container.resolve('entity/TankEntity', {
        model: { name: 'tank' },
        movable: { body: 'Tank' }
    });
    ent.components.healable.currentHealth = 100;
    ent.components.healable.maximumHealth = 100;
    return ent;
}

function generatorEntity(container) {
    var ent = container.resolve('entity/GeneratorEntity', {
        model: { name: 'generator' },
        movable: { body: 'Generator' }
    });
    ent.components.healable.currentHealth = 50;
    ent.components.healable.maximumHealth = 50;
    return ent;
}

function healerEntity(container) {
    var ent = container.resolve('entity/HealerEntity', {
        model: { name: 'healer' },
        movable: { body: 'Healer' }
    });
    ent.components.healable.currentHealth = 50;
    ent.components.healable.maximumHealth = 50;
    return ent;
}

function cannonEntity(container) {
    var ent = container.resolve('entity/CannonEntity', {
        model: { name: 'cannon' },
        movable: { body: 'Cannon' }
    });
    ent.components.healable.currentHealth = 50;
    ent.components.healable.maximumHealth = 50;
    ent.components.cannon.range = 8;
    return ent;
}

function buildingMarker(container) {
    return container.resolve('entity/BuildingMarkerEntity', {
        model: { name: 'build-marker' },
        placement: { physicsControlled: true },
        follow: { snap: 'hex', offset: { x: 2 , y: 0 } }
    });
}

function genericEnemy(container) {
    var ent = container.resolve('entity/EnemyEntity', {
        model: { name: 'genericEnemy' },
        movable: { body: 'GenericEnemy' }
    });
    ent.components.healable.currentHealth = 10;
    ent.components.healable.maximumHealth = 10;
    ent.components.melee.damage = 1;
    return ent;
}

function mineralEntity(container, type) {
    var ent = container.resolve('entity/MineralEntity', {
        model: { name: type + '-mineral' },
        movable: { body: 'Mineral' }
    });
    ent.components.resource.type = ent.components.resource.ResourceType[type.toUpperCase()];
    return ent;
}

function register(container) {
    container.registerType('entity/PlayerEntity/newPlayer', newPlayer.bind(null, container));
    container.registerType('entity/PlayerEntity/clientPlayer', clientPlayer.bind(null, container));
    container.registerType('entity/WallEntity/wall', wallEntity.bind(null, container));
    container.registerType('entity/BaseEntity/base', baseEntity.bind(null, container));
    container.registerType('entity/TankEntity/tank', tankEntity.bind(null, container));
    container.registerType('entity/GeneratorEntity/generator', generatorEntity.bind(null, container));
    container.registerType('entity/HealerEntity/healer', healerEntity.bind(null, container));
    container.registerType('entity/CannonEntity/cannon', cannonEntity.bind(null, container));
    container.registerType('entity/BuildingMarkerEntity/buildingMarker', buildingMarker.bind(null, container));
    container.registerType('entity/EnemyEntity/slime', genericEnemy.bind(null, container));
    container.registerType('entity/MineralEntity/red', mineralEntity.bind(null, container, 'red'));
    container.registerType('entity/MineralEntity/green', mineralEntity.bind(null, container, 'green'));
    container.registerType('entity/MineralEntity/blue', mineralEntity.bind(null, container, 'blue'));
    container.registerType('entity/MineralEntity/purple', mineralEntity.bind(null, container, 'purple'));
}

module.exports = {
    register: register
};
