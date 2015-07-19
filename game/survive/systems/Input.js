"use strict";
var limit = require('../../etc/ratelimiter.js');

function Input(container, physics, ClientActions, path, pixi, world, game, renderer) {
    var self = this;

    var playerKeys = {};
    var releasedKeys = {};
    var mouseClicks = [];

    var player = null;
    game.events.on('playerLoaded', function (ent) { player = ent; });

    document.addEventListener('keydown', playerKeysDown, false);
    document.addEventListener('keyup', playerKeysUp, false);
    document.addEventListener('keypress', playerKeyPress, false);
    document.addEventListener('click', mouseClick, false);

    var chatOpen = false;
    game.events.on('close-chat-entry', function () {
        chatOpen = false;
    });
    game.events.on('open-chat-entry', function () {
        chatOpen = true;
    });

    function interruptAction() {
        //using = false;
    }

    var pointScratch = new pixi.Point();
    function mouseClick(e) {
        renderer.mouse.getLocalPosition(renderer.world, pointScratch);
        renderer.applyInverseCoordinateTransform(pointScratch, pointScratch.x / renderer.GFX_SCALE, pointScratch.y * -1 / renderer.GFX_SCALE);
        mouseClicks.push({
            button: e.button,
            x: pointScratch.x,
            y: pointScratch.y
        });
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

    var UP = { x: 0, y: 1 };
    var DOWN = { x: 0, y: -1 };
    var LEFT = { x: -1, y: 0 };
    var RIGHT = { x: 1, y: 0 };

    self.step = function step() {
        var scratch = physics.scratchpad();
        var newTarget = scratch.vector().zero();

        if (playerKeys[65]) {
            // a
            interruptAction();
            newTarget.add(LEFT.x, LEFT.y);
        } else if (playerKeys[68]) {
            // d
            interruptAction();
            newTarget.add(RIGHT.x, RIGHT.y);
        }
        if (playerKeys[87]) {
            // w
            interruptAction();
            newTarget.add(UP.x, UP.y);
        } else if (playerKeys[83]) {
            // s
            interruptAction();
            newTarget.add(DOWN.x, DOWN.y);
        }

        if (releasedKeys[78]) {
            // n
            interruptAction();
            ClientActions.spawnEnemy();
            releasedKeys[78] = false;
        }

        while (mouseClicks.length !== 0) {
            var clickData = mouseClicks.pop();
            if (clickData.button === 0) {
                attack(clickData);
            }
        }

        newTarget.rotate(Math.PI / 2);

        setPlayerVelocity(newTarget);
        setPlayerOrientation(renderer.mouse);

        scratch.done();
    };

    function attack(clickData) {
        if (player) {
            ClientActions.attack({ x: clickData.x, y: clickData.y }, 0);
        }
    }

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
}

module.exports = Input;
module.exports.$inject = ['$container', 'lib/physicsjs', 'ClientActions', 'Pathfinder', 'lib/pixi.js', 'World', 'Game', 'system/Renderer'];
