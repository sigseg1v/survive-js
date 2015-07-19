"use strict";

var container = require('./game/inversion/container.js');
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

container.registerAlias('Hex', require('./game/engine/world/Hex.js'));
container.registerType('Graphics', require('./game/engine/presentation/Graphics.js'));
container.registerInstance('Pathfinder', require('./game/engine/world/Pathfinder.js'));

if (!isServer) {
    var pixiLib = require('pixi.js');
    var pixiMultiStyleText = require('pixi-multistyle-text');
    pixiMultiStyleText(pixiLib); // patch onto pixi
    container.registerAlias('lib/pixi.js', pixiLib);
}

var physjs_patch = require('./assets/bower_components/physicsjs/dist/physicsjs-full.js');
var physicsExtensions = require('./game/engine/world/physics-extensions.js');
physicsExtensions.extend(physjs_patch);
container.registerAlias('lib/physicsjs', physjs_patch);
if (isServer) container.registerAlias('Server', require('./game/survive/game/Server.js'));
if (!isServer) container.registerAlias('Client', require('./game/survive/game/Client.js'));
if (!isServer) container.registerInstance('ClientMessageHandler', require('./game/survive/game/ClientMessageHandler.js'));
container.registerInstance('Tuning', require('./game/survive/game/GameTuning.js'));

container.registerAlias('Entity', require('./game/engine/Entity.js'));
container.registerAlias('Component', require('./game/engine/Component.js'));
container.registerType('entity/DisplayEntity', require('./game/survive/entities/DisplayEntity.js'));
container.registerType('entity/WallEntity', require('./game/survive/entities/WallEntity.js'));
container.registerType('entity/BaseEntity', require('./game/survive/entities/BaseEntity.js'));
container.registerType('entity/TankEntity', require('./game/survive/entities/TankEntity.js'));
container.registerType('entity/GeneratorEntity', require('./game/survive/entities/GeneratorEntity.js'));
container.registerType('entity/HealerEntity', require('./game/survive/entities/HealerEntity.js'));
container.registerType('entity/CannonEntity', require('./game/survive/entities/CannonEntity.js'));
container.registerType('entity/BuildingMarkerEntity', require('./game/survive/entities/BuildingMarkerEntity.js'));
container.registerType('entity/EnemyEntity', require('./game/survive/entities/EnemyEntity.js'));
container.registerType('entity/MineralEntity', require('./game/survive/entities/MineralEntity.js'));

container.registerInstance('Game', require('./game/engine/Game.js'));
container.registerInstance('World', require('./game/engine/world/World.js'));
if (isServer) container.registerInstance('ClientStateManager', require('./game/engine/ClientStateManager.js'));
if (isServer) container.registerInstance('ServerActions', require('./game/survive/game/ServerActions.js'));
if (!isServer) container.registerInstance('ClientActions', require('./game/survive/game/ClientActions.js'));
container.registerInstance('component/Placement', require('./game/survive/components/Placement.js'));
container.registerInstance('component/Model', require('./game/survive/components/Model.js'));
container.registerInstance('component/Movable', require('./game/survive/components/Movable.js'));
container.registerInstance('component/Tracelog', require('./game/survive/components/Tracelog.js'));
container.registerInstance('component/Follow', require('./game/survive/components/Follow.js'));
container.registerInstance('component/Generator', require('./game/survive/components/Generator.js'));
container.registerInstance('component/Chargeable', require('./game/survive/components/Chargeable.js'));
container.registerInstance('component/Healer', require('./game/survive/components/Healer.js'));
container.registerInstance('component/Healable', require('./game/survive/components/Healable.js'));
container.registerInstance('component/Lightsource', require('./game/survive/components/Lightsource.js'));
container.registerInstance('component/Path', require('./game/survive/components/Path.js'));
container.registerInstance('component/Resource', require('./game/survive/components/Resource.js'));
container.registerInstance('component/ResourceBars', require('./game/survive/components/ResourceBars.js'));
container.registerInstance('component/Miner', require('./game/survive/components/Miner.js'));
container.registerInstance('component/Cannon', require('./game/survive/components/Cannon.js'));
container.registerInstance('component/Melee', require('./game/survive/components/Melee.js'));
container.registerInstance('component/Name', require('./game/survive/components/Name.js'));
container.registerInstance('component/Use', require('./game/survive/components/Use.js'));
container.registerInstance('component/Base', require('./game/survive/components/Base.js'));

container.registerType('entity/PlayerEntity', require('./game/survive/entities/PlayerEntity.js'));

if (!isServer) container.registerInstance('system/Renderer', require('./game/survive/systems/Renderer.js'));
container.registerInstance('system/Movement', require('./game/survive/systems/Movement.js'));
if (!isServer) container.registerInstance('system/Input', require('./game/survive/systems/Input.js'));
if (isServer) container.registerInstance('system/StateBroadcaster', require('./game/survive/systems/StateBroadcaster.js'));
if (!isServer) container.registerInstance('system/StateSyncer', require('./game/survive/systems/StateSyncer.js'));
if (isServer) container.registerInstance('system/PlayerSync', require('./game/survive/systems/PlayerSync-Server.js'));
if (!isServer) container.registerInstance('system/PlayerSync', require('./game/survive/systems/PlayerSync-Client.js'));
if (isServer) container.registerInstance('system/PhysicsSync', require('./game/survive/systems/DynamicPhysicsSync-Server.js'));
if (!isServer) container.registerInstance('system/PhysicsSync', require('./game/survive/systems/DynamicPhysicsSync-Client.js'));
if (isServer) container.registerInstance('system/ChunkManager', require('./game/survive/systems/ChunkManager-Server.js'));
if (!isServer) container.registerInstance('system/ChunkManager', require('./game/survive/systems/ChunkManager-Client.js'));
container.registerInstance('system/NetworkPing', require('./game/survive/systems/NetworkPing.js'));
container.registerInstance('system/TracelogWrite', require('./game/survive/systems/TracelogWrite.js'));
container.registerInstance('system/GeneratorCycle', require('./game/survive/systems/GeneratorCycle.js'));
container.registerInstance('system/HealerCycle', require('./game/survive/systems/HealerCycle.js'));
container.registerInstance('system/CannonCycle', require('./game/survive/systems/CannonCycle.js'));
container.registerInstance('system/MeleeCycle', require('./game/survive/systems/MeleeCycle.js'));
container.registerInstance('system/FollowPath', require('./game/survive/systems/FollowPath.js'));
container.registerInstance('system/Cheats', require('./game/survive/systems/Cheats.js'));
if (!isServer) container.registerInstance('system/ControlResourceBars', require('./game/survive/systems/ControlResourceBars.js'));
if (!isServer) container.registerInstance('system/UpdateNameplates', require('./game/survive/systems/UpdateNameplates.js'));
if (isServer) container.registerInstance('system/DayNightCycle', require('./game/survive/systems/DayNightCycle-Server.js'));
if (!isServer) container.registerInstance('system/DayNightCycle', require('./game/survive/systems/DayNightCycle-Client.js'));
if (!isServer) container.registerInstance('system/Chat', require('./game/survive/systems/Chat-Client.js'));
if (!isServer) container.registerInstance('system/DrawBuildMenu', require('./game/survive/systems/DrawBuildMenu.js'));
if (!isServer) container.registerInstance('system/DrawMineralCount', require('./game/survive/systems/DrawMineralCount.js'));
if (!isServer) container.registerInstance('system/CalculateLighting', require('./game/survive/systems/CalculateLighting.js'));
if (isServer) container.registerInstance('system/ResourceAutoGatherCycle', require('./game/survive/systems/ResourceAutoGatherCycle.js'));

container.registerInstance('system/Effects', require('./game/survive/systems/Effects.js'));

require('./game/survive/content/entityConfigurations.js').register(container);

module.exports = resolver;
