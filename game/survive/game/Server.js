"use strict";

function loadGame() {
    var container = require('../../../wires.js');
    var loader = require('../../../assets/scripts/testWorld.js');
    var Hex = require('../../engine/world/Hex.js');
    var game = container.resolve('Game');
    var world = container.resolve('World');
    game.mode = game.runModes.automaticAsync;
    var followPath = container.resolve('system/FollowPath');
    var movement = container.resolve('system/Movement');
    var chunkManager = container.resolve('system/ChunkManager');
    var generator = container.resolve('system/GeneratorCycle');
    var healer = container.resolve('system/HealerCycle');
    var autoGather = container.resolve('system/ResourceAutoGatherCycle');
    var cannonAttack = container.resolve('system/CannonCycle');
    var meleeAttack = container.resolve('system/MeleeCycle');
    var stateBroadcaster = container.resolve('system/StateBroadcaster');
    var playerSync = container.resolve('system/PlayerSync');
    var physicsSync = container.resolve('system/PhysicsSync');
    //var networkPing = container.resolve('system/NetworkPing');
    var dayNight = container.resolve('system/DayNightCycle');
    var cheats = container.resolve('system/Cheats');
    game.registerSystem(followPath);
    game.registerSystem(dayNight);
    game.registerSystem(movement);
    game.registerSystem(generator);
    game.registerSystem(healer);
    game.registerSystem(autoGather);
    game.registerSystem(cannonAttack);
    game.registerSystem(meleeAttack);
    game.registerSystem(playerSync);
    game.registerSystem(physicsSync);
    game.registerSystem(chunkManager);
    game.registerSystem(stateBroadcaster);
    //game.registerSystem(networkPing);
    game.registerSystem(cheats);
    if (process.env.TRACE) {
        game.registerSystem(container.resolve('system/TracelogWrite'));
    }

    var levelData = loader.parse(loader.data);
    var floorTiles = levelData.floors.map(function (floor) {
        var position = floor.getCenter();
        return Hex.fromCartesian(position.x, position.y, 1);
    });
    var wallEntities = levelData.walls.map(function (wall) {
        var entity = container.resolve('entity/WallEntity/wall');
        var position = wall.getCenter();
        entity.components.placement.position = position;
        return entity;
    });
    var mineralEntities = levelData.minerals.map(function (data) {
        var hex = data.hex;
        var type = data.type;
        var entity = container.resolve('entity/MineralEntity/' + type);
        var position = hex.getCenter();
        entity.components.placement.position = position;
        return entity;
    });
    world.setFloor(floorTiles);
    world.addEntities(wallEntities);
    world.addEntities(mineralEntities);

    return game;
}

function initWebsockets() {
    var container = require('../../../wires.js');
    var ServerActions = container.resolve('ServerActions');
    var io = container.resolve('socket');
    var serverRpc = container.resolve('serverRpc');
    io.on('connection', function (socket) {
        handleSocketConnected(socket);

        socket.on('disconnect', handleSocketDisconnected.bind({}, socket));
        socket.on('error', function (err) {
            console.log(err);
        });
    });
    io.on('error', function (err) {
        console.log(err);
    });
    serverRpc.expose('player-actions', ServerActions.exposedActions);
}

function handleSocketConnected(socket) {
    console.log('socket connected');

    socket.once('playerConfigData', handlePlayerConfigData.bind({}, socket));
}

function handlePlayerConfigData(socket, playerData) {
    var container = require('../../../wires.js');
    var world = container.resolve('World');
    var csm = container.resolve('ClientStateManager');
    var game = container.resolve('Game');
    var chunkManager = container.resolve('system/ChunkManager');
    var player = container.resolve('entity/PlayerEntity/newPlayer');

    console.log('player name joined:' + playerData.name);

    csm.addClient(socket);

    var state = csm.getClientState(socket);
    state.player = player;
    player.components.name.name = playerData.name;
    socket.emit('playerId', player.id);
    chunkManager.setObservableChunksForClient(state);
    socket.emit('ChunkManager.loadedChunks', state.chunkMapToNetwork());
    socket.emit('World.floorTiles', world.floorTiles);
    world.addEntity(player, true);

    world.sendEntitiesToSocketFragmented(socket, Object.keys(world.entitiesById).map(function (k) { return world.entitiesById[k]; }).filter(function (entity) {
        return state.shouldGetUpdateForEntity(entity);
    }));

    socket.emit('worldLoaded');

    // tell everyone except this user that the player was created
    socket.broadcast.emit('World.addEntity', player);
    game.events.emit('userConnected', {
        player: player,
        socket: socket
    });

    // players are controlled externally, so don't apply physics to them
    player.components.movable.body.integrationMode('disabled');
}

function handleSocketDisconnected(socket) {
    var container = require('../../../wires.js');
    var ServerActions = container.resolve('ServerActions');
    console.log('socket disconnected');
    var csm = container.resolve('ClientStateManager');
    var state = csm.getClientState(socket);
    var player = state ? state.player : null;
    if (player) {
        var world = container.resolve('World');

        ServerActions.getPlayerChildEntities(player).forEach(function (child) {
            world.removeEntity(child);
        });

        world.removeEntity(player);

    }
    if (state) {
        csm.removeClient(socket);
    }
}

function startServer() {
    var game = loadGame();
    game.run();
    initWebsockets();
}

function getPlayerBySocketId(id) {
    var container = require('../../../wires.js');
    var csm = container.resolve('ClientStateManager');
    var state = csm.idStateMap[id];
    return state ? state.player : null;
}

module.exports = {
    start: startServer,
    getPlayerBySocketId: getPlayerBySocketId
};
