"use strict";
var limit = require('../../etc/ratelimiter.js');

function Input(container, physics, ClientActions, path, pixi, world, game, renderer) {
    var self = this;

    var playerKeys = {};
    var releasedKeys = {};

    var player = null;
    game.events.on('playerLoaded', function (ent) { player = ent; });

    document.addEventListener('keydown', playerKeysDown, false);
    document.addEventListener('keyup', playerKeysUp, false);
    document.addEventListener('keypress', playerKeyPress, false);

    var chatOpen = false;
    game.events.on('close-chat-entry', function () {
        chatOpen = false;
    });
    game.events.on('open-chat-entry', function () {
        chatOpen = true;
    });

    var buildMenuOpen = false;
    game.events.on('buildmenu-open', function () {
        buildMenuOpen = true;
    });
    game.events.on('buildmenu-close', function () {
        buildMenuOpen = false;
    });

    var using = false;
    var gather_limit = limit(100, ClientActions.consumeNearby);

    function interruptAction() {
        using = false;
    }

    function playerKeysDown(e) {
        playerKeys[e.keyCode] = true;
    }
    function playerKeysUp(e) {
        if (e.keyCode === 8) {
            // backspace -- in general, we don't want this to activate because we want to prevent browser navigate-back
            // and backspace doesn't even get picked up in the keypress event anyway so this is probably fine
            e.preventDefault();
        }

        if (e.keyCode === 27 && chatOpen) {
            // escape
            game.events.emit('close-chat-entry');
        }

        releasedKeys[e.keyCode] = true;
        playerKeys[e.keyCode] = false;

        // e.preventDefault();
    }
    function playerKeyPress(e) {
        if (e.keyCode === 13) {
            // enter
            if (chatOpen) {
                game.events.emit('send-chat-entry');
                game.events.emit('close-chat-entry');
            } else {
                game.events.emit('open-chat-entry');
            }
        }
    }

    self.step = function step() {
        var scratch = physics.scratchpad();
        var newPosition = scratch.vector().zero();

        if (playerKeys[65]) {
            // a
            interruptAction();
            newPosition.add(-1, 0);
        } else if (playerKeys[68]) {
            // d
            interruptAction();
            newPosition.add(1, 0);
        }
        if (playerKeys[87]) {
            // w
            interruptAction();
            newPosition.add(0, 1);
        } else if (playerKeys[83]) {
            // s
            interruptAction();
            newPosition.add(0, -1);
        }

        if (releasedKeys[66]) {
            // b
            interruptAction();
            ClientActions.toggleBuildMenu();
            releasedKeys[66] = false;
        }

        if (releasedKeys[49]) {
            // # 1
            interruptAction();
            if (buildMenuOpen) {
                ClientActions.createBuilding('Base');
            }
            releasedKeys[49] = false;
        }

        if (releasedKeys[50]) {
            // # 2
            interruptAction();
            if (buildMenuOpen) {
                ClientActions.createBuilding('Generator');
            }
            releasedKeys[50] = false;
        }

        if (releasedKeys[51]) {
            // # 3
            interruptAction();
            if (buildMenuOpen) {
                ClientActions.createBuilding('Healer');
            }
            releasedKeys[51] = false;
        }

        if (releasedKeys[52]) {
            // # 4
            interruptAction();
            if (buildMenuOpen) {
                ClientActions.createBuilding('Cannon');
            }
            releasedKeys[52] = false;
        }

        if (releasedKeys[53]) {
            // # 5
            interruptAction();
            if (buildMenuOpen) {
                ClientActions.createBuilding('Wall');
            }
            releasedKeys[53] = false;
        }

        if (releasedKeys[78]) {
            // n
            interruptAction();
            ClientActions.spawnEnemy();
            releasedKeys[78] = false;
        }

        if (releasedKeys[80]) {
            // p
            interruptAction();
            testDrawPathToCenter();
            releasedKeys[80] = false;
        }

        // if (releasedKeys[219]) {
        //     // '['
        //     interruptAction();
        //     ClientActions.pathEnemiesToPlayer();
        //     releasedKeys[219] = false;
        // }

        if (releasedKeys[32]) {
            // space
            if (!using) {
                interruptAction();
                using = true;
            }
            releasedKeys[32] = false;
        }

        setPlayerVelocity(newPosition);
        setPlayerOrientation(renderer.mouse);

        if (using) {
            gather_limit();
        }

        scratch.done();
    };

    function setPlayerVelocity(target) {
        var scratch = physics.scratchpad();
        if (player) {
            player.components.movable.velocity = scratch.vector().clone(target).normalize().mult(player.components.movable.speed);
        }
        scratch.done();
    }

    function setPlayerOrientation(mouseData) {
        var scratch = physics.scratchpad();
        if (player && player.components.model.sprites.length > 0) {
            var playerStageVector = scratch.vector().clone(player.components.model.sprites[0].toGlobal(renderer.stage.position));
            player.components.placement.orientation = scratch.vector().clone(mouseData.global).vsub(playerStageVector).angle() * -1;
            player.components.movable.body.state.angular.vel = 0;
        }
        scratch.done();
    }

    function testDrawPathToCenter() {
        if (!player) return;

        var pathNodes = path.findPath({
            start: player.components.placement.position,
            end: { x: 0, y: 0 },
            wallsOnly: false
        });

        var sprites = pathNodes.map(function (node) {
            var graphics = new pixi.Graphics();
            graphics.beginFill(0x000000FF);
            graphics.drawCircle(node.x * renderer.GFX_SCALE, node.y * -1 * renderer.GFX_SCALE, 0.25 * renderer.GFX_SCALE);
            graphics.endFill();
            return graphics;
        });
        sprites.forEach(function (sprite) {
            game.events.emit('addGraphics', sprite);
        });
        setTimeout(function () {
            sprites.forEach(function (sprite) {
                game.events.emit('removeGraphics', sprite);
            });
        }, 3000);
    }
}

module.exports = Input;
module.exports.$inject = ['$container', 'lib/physicsjs', 'ClientActions', 'Pathfinder', 'lib/pixi.js', 'World', 'Game', 'system/Renderer'];
