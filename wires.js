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
container.registerAlias('Block', require('./game/engine/world/Block.js'));
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
container.registerType('entity/EnemyEntity', require('./game/survive/entities/EnemyEntity.js'));

container.registerInstance('Game', require('./game/engine/Game.js'));
container.registerInstance('World', require('./game/engine/world/World.js'));
if (isServer) container.registerInstance('ClientStateManager', require('./game/engine/ClientStateManager.js'));
if (isServer) container.registerInstance('ServerActions', require('./game/survive/game/ServerActions.js'));
if (!isServer) container.registerInstance('ClientActions', require('./game/survive/game/ClientActions.js'));
container.registerInstance('component/Placement', require('./game/survive/components/Placement.js'));
container.registerInstance('component/Model', require('./game/survive/components/Model.js'));
container.registerInstance('component/Movable', require('./game/survive/components/Movable.js'));
container.registerInstance('component/Follow', require('./game/survive/components/Follow.js'));
container.registerInstance('component/Lightsource', require('./game/survive/components/Lightsource.js'));
container.registerInstance('component/Path', require('./game/survive/components/Path.js'));
container.registerInstance('component/Name', require('./game/survive/components/Name.js'));
container.registerInstance('component/Use', require('./game/survive/components/Use.js'));
container.registerInstance('component/Health', require('./game/survive/components/Health.js'));
container.registerInstance('component/Melee', require('./game/survive/components/Melee.js'));

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
container.registerInstance('system/FollowPath', require('./game/survive/systems/FollowPath.js'));
container.registerInstance('system/Cheats', require('./game/survive/systems/Cheats.js'));
if (!isServer) container.registerInstance('system/UpdateNameplates', require('./game/survive/systems/UpdateNameplates.js'));
if (!isServer) container.registerInstance('system/Chat', require('./game/survive/systems/Chat-Client.js'));
if (!isServer) container.registerInstance('system/CalculateLighting', require('./game/survive/systems/CalculateLighting.js'));

container.registerInstance('system/Effects', require('./game/survive/systems/Effects.js'));

require('./game/survive/content/entityConfigurations.js').register(container);

module.exports = resolver;
