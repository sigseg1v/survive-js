(function(exports) {
    "use strict";
    var container = require('../../../wires.js');

    function init() {
        loadAssets();
        var game = loadGame();
        var renderer = configureRenderer();

        var socket = container.resolve('socket');
        var player = container.resolve('entity/PlayerEntity/clientPlayer');
        var world = container.resolve('World');
        var messageHandler = container.resolve('ClientMessageHandler');
        var actions = container.resolve('ClientActions');

        socket.once('playerId', function (id) {
            player.id = id;
            container.resolve('Entity').prototype.setPrototypeIdPrefix(id.toString());
            player.components.movable.body.integrationMode('normal');
            world.addEntity(player);
            game.events.emit('playerLoaded', player);
        });

        socket.once('worldLoaded', function() {
            actions.getDayNightStatus().then(function (result) {
                container.resolve('system/DayNightCycle').update(result);
            });
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
        //var networkPing = container.resolve('system/NetworkPing');
        var resourceBars = container.resolve('system/ControlResourceBars');
        var nameplates = container.resolve('system/UpdateNameplates');
        var dayNight = container.resolve('system/DayNightCycle');
        var chat = container.resolve('system/Chat');
        var drawBuildMenu = container.resolve('system/DrawBuildMenu');
        var drawMineralCount = container.resolve('system/DrawMineralCount');
        var calculateLighting = container.resolve('system/CalculateLighting');
        var cheats = container.resolve('system/Cheats');
        // @ifdef TRACE
        var tracelogWrite = container.resolve('system/TracelogWrite');
        // @endif

        game.registerSystem(input);
        game.registerSystem(playerSync);
        game.registerSystem(physicsSync);
        game.registerSystem(stateSyncer);
        game.registerSystem(dayNight);
        game.registerSystem(movement);
        game.registerSystem(chunkManager);
        game.registerSystem(resourceBars, true);
        game.registerSystem(nameplates, true);
        game.registerSystem(effects, true);
        //game.registerSystem(networkPing);
        game.registerSystem(renderer, true);
        game.registerSystem(chat);
        game.registerSystem(drawBuildMenu, true);
        game.registerSystem(drawMineralCount, true);
        game.registerSystem(calculateLighting, true);
        game.registerSystem(cheats);
        // @ifdef TRACE
        game.registerSystem(tracelogWrite);
        // @endif

        return game;
    }

    function loadAssets() {
        require('../content/sprites.js').register(container);
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
