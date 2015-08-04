(function(exports) {
    "use strict";
    var container = require('wires');

    function init() {
        loadAssets();
        var game = loadGame();
        var renderer = configureRenderer();

        var socket = container.resolve('socket');
        var player = container.resolve('entity/PlayerEntity/clientPlayer');
        var world = container.resolve('World');
        var messageHandler = container.resolve('ClientMessageHandler');
        var actions = container.resolve('ClientActions');
        container.resolve('BoundaryManager');

        socket.once('playerId', function (id) {
            player.id = id;
            container.resolve('Entity').prototype.setPrototypeIdPrefix(id.toString());
            player.components.movable.body.integrationMode('normal');
            world.addEntity(player);
            game.events.emit('playerLoaded', player);
        });

        socket.once('worldLoaded', function() {
            game.events.emit('worldLoaded');
        });

        game.registerSystem({
            step: function step() {
                renderer.focus = player.components.placement.position;
            }
        });

        messageHandler.registerHandlers();

        // start the game
        window.setInterval(game.run, 1000/60);
    }

    function login(data) {
        var socket = container.resolve('socket');

        socket.emit('playerConfigData', data);
    }

    function loadGame() {
        var game = container.resolve('Game');

        game.mode = game.runModes.noBlockWithRAF;
        var input = container.resolve('system/Input');
        var stateSyncer = container.resolve('system/StateSyncer');
        var movement = container.resolve('system/Movement');
        var chunkManager = container.resolve('system/ChunkManager');
        var effects = container.resolve('system/Effects');
        var renderer = container.resolve('system/Renderer');
        var playerSync = container.resolve('system/PlayerSync');
        var physicsSync = container.resolve('system/PhysicsSync');
        var nameplates = container.resolve('system/UpdateNameplates');
        var chat = container.resolve('system/Chat');
        var calculateLighting = container.resolve('system/CalculateLighting');
        var cheats = container.resolve('system/Cheats');
        var vision = container.resolve('system/VisionRaycaster');

        game.registerSystem(input);
        game.registerSystem(playerSync);
        game.registerSystem(physicsSync);
        game.registerSystem(stateSyncer);
        game.registerSystem(movement);
        game.registerSystem(chunkManager);
        game.registerSystem(nameplates, true);
        game.registerSystem(effects, true);
        game.registerSystem(renderer, true);
        game.registerSystem(chat);
        game.registerSystem(calculateLighting, true);
        game.registerSystem(vision, true);
        game.registerSystem(cheats);

        return game;
    }

    function loadAssets() {
        require('game/survive/content/sprites').register(container);
    }

    function configureRenderer() {
        var renderer = container.resolve('system/Renderer');
        renderer.world.position.x = 640;
        renderer.world.position.y = 360;
        renderer.zoom = 40;

        return renderer;
    }

    exports.survive = {
        init: init,
        login: login,
        playerData: {}
    };
})(window);
