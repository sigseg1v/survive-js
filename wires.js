"use strict";
require('array.prototype.find');

var container = require('game/inversion/container');
var Promise = require('bluebird');
var isServer = typeof window === 'undefined';

var resolver = {
    resolve: container.resolve.bind(container)
};

container.registerAlias('$container', resolver);

if (!isServer) {
    // RFC6455 The WebSocket Protocol (https://tools.ietf.org/html/rfc6455)
    // "There MUST be no more than one connection in a CONNECTING state."
    // if you try to connect both at the same time, bad things happen, so be careful that this doesn't happen (eg. don't join a room while a different socket is connecting)
    var mainSocket = require('socket.io-client')();
    container.registerAlias('socket', mainSocket);
    var rpcDefer = Promise.defer();
    container.registerAlias('rpcClient', rpcDefer.promise);
    mainSocket.on('connect', function() {
        var rpcClient = require('socket.io-rpc-client')();
        rpcDefer.resolve(rpcClient);
    });

    var documentReady = Promise.defer();
    $(document).ready(function () {
        documentReady.resolve();
    });
    container.registerAlias('documentReady', documentReady.promise);
}

container.registerAlias('Hex', require('game/engine/world/Hex'));
container.registerAlias('Block', require('game/engine/world/Block'));
container.registerType('Graphics', require('game/engine/presentation/Graphics'));
container.registerInstance('Pathfinder', require('game/engine/world/Pathfinder'));
if (!isServer) {
    // server doesn't care about wasting calculations on walls since client only needs it for vision
    container.registerInstance('BoundaryManager', require('game/engine/world/BoundaryManager'));
}

if (!isServer) {
    var pixiLib = require('pixi.js');
    var pixiMultiStyleText = require('pixi-multistyle-text');
    pixiMultiStyleText(pixiLib); // patch onto pixi
    container.registerAlias('lib/pixi.js', pixiLib);
}

var physjs_patch = require('assets/bower_components/physicsjs/dist/physicsjs-full');
var physicsExtensions = require('game/engine/world/physics-extensions');
physicsExtensions.extend(physjs_patch);
container.registerAlias('lib/physicsjs', physjs_patch);
if (isServer) container.registerAlias('Server', require('game/survive/game/Server'));
if (!isServer) container.registerAlias('Client', require('game/survive/game/Client'));
if (!isServer) container.registerInstance('ClientMessageHandler', require('game/survive/game/ClientMessageHandler'));
container.registerInstance('Tuning', require('game/survive/game/GameTuning'));

container.registerAlias('Entity', require('game/engine/Entity'));
container.registerAlias('Component', require('game/engine/Component'));
container.registerType('entity/DisplayEntity', require('game/survive/entities/DisplayEntity'));
container.registerType('entity/WallEntity', require('game/survive/entities/WallEntity'));
container.registerType('entity/EnemyEntity', require('game/survive/entities/EnemyEntity'));
container.registerType('entity/SpawnerEntity', require('game/survive/entities/SpawnerEntity'));

container.registerInstance('Game', require('game/engine/Game'));
container.registerInstance('World', require('game/engine/world/World'));
if (isServer) container.registerInstance('ClientStateManager', require('game/engine/ClientStateManager'));
if (isServer) container.registerInstance('PlayerState', require('game/survive/game/PlayerState-Server'));
if (!isServer) container.registerInstance('PlayerState', require('game/survive/game/PlayerState-Client'));
if (isServer) container.registerInstance('ServerActions', require('game/survive/game/ServerActions'));
if (!isServer) container.registerInstance('ClientActions', require('game/survive/game/ClientActions'));
container.registerInstance('component/Placement', require('game/survive/components/Placement'));
container.registerInstance('component/Model', require('game/survive/components/Model'));
container.registerInstance('component/Movable', require('game/survive/components/Movable'));
container.registerInstance('component/Follow', require('game/survive/components/Follow'));
container.registerInstance('component/Lightsource', require('game/survive/components/Lightsource'));
container.registerInstance('component/Path', require('game/survive/components/Path'));
container.registerInstance('component/Name', require('game/survive/components/Name'));
container.registerInstance('component/Use', require('game/survive/components/Use'));
container.registerInstance('component/Health', require('game/survive/components/Health'));
container.registerInstance('component/Melee', require('game/survive/components/Melee'));
container.registerInstance('component/RangedAttack', require('game/survive/components/RangedAttack'));
container.registerInstance('component/Spawner', require('game/survive/components/Spawner'));
container.registerInstance('component/Lighttrail', require('game/survive/components/Lighttrail'));
container.registerInstance('component/Aggro', require('game/survive/components/Aggro'));
container.registerInstance('component/LightrayIntersector', require('game/survive/components/LightrayIntersector'));

container.registerType('entity/PlayerEntity', require('game/survive/entities/PlayerEntity'));

if (!isServer) container.registerInstance('system/Renderer', require('game/survive/systems/Renderer'));
container.registerInstance('system/Movement', require('game/survive/systems/Movement'));
if (!isServer) container.registerInstance('system/Input', require('game/survive/systems/Input'));
if (isServer) container.registerInstance('system/StateBroadcaster', require('game/survive/systems/StateBroadcaster'));
if (!isServer) container.registerInstance('system/StateSyncer', require('game/survive/systems/StateSyncer'));
if (isServer) container.registerInstance('system/PlayerSync', require('game/survive/systems/PlayerSync-Server'));
if (!isServer) container.registerInstance('system/PlayerSync', require('game/survive/systems/PlayerSync-Client'));
if (isServer) container.registerInstance('system/PhysicsSync', require('game/survive/systems/DynamicPhysicsSync-Server'));
if (!isServer) container.registerInstance('system/PhysicsSync', require('game/survive/systems/DynamicPhysicsSync-Client'));
if (isServer) container.registerInstance('system/ChunkManager', require('game/survive/systems/ChunkManager-Server'));
if (!isServer) container.registerInstance('system/ChunkManager', require('game/survive/systems/ChunkManager-Client'));
container.registerInstance('system/FollowPath', require('game/survive/systems/FollowPath'));
container.registerInstance('system/Cheats', require('game/survive/systems/Cheats'));
if (!isServer) container.registerInstance('system/UpdateNameplates', require('game/survive/systems/UpdateNameplates'));
if (!isServer) container.registerInstance('system/Chat', require('game/survive/systems/Chat-Client'));
if (!isServer) container.registerInstance('system/ResourceUI', require('game/survive/systems/ResourceUI'));
if (!isServer) container.registerInstance('system/CalculateLighting', require('game/survive/systems/CalculateLighting'));
if (isServer) container.registerInstance('system/SpawnerCycle', require('game/survive/systems/SpawnerCycle'));
if (isServer) container.registerInstance('system/EnemyTargetting', require('game/survive/systems/EnemyTargetting'));
if (isServer) container.registerInstance('system/DeployLighttrails', require('game/survive/systems/DeployLighttrails'));
if (!isServer) container.registerInstance('system/VisionRaycaster', require('game/survive/systems/VisionRaycaster'));

if (!isServer) container.registerInstance('system/Effects', require('game/survive/systems/Effects'));

require('game/survive/content/entityConfigurations').register(container);

module.exports = resolver;
