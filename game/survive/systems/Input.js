"use strict";
var limit = require('game/etc/ratelimiter');

function Input(container, physics, ClientActions, path, pixi, world, game, renderer, Effects, constants) {
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
        renderer.applyInverseCoordinateTransform(pointScratch);
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

    var UP = renderer.applyInverseCoordinateTransformUnscaled({ x: 1, y: 0 });
    var DOWN = renderer.applyInverseCoordinateTransformUnscaled({ x: -1, y: 0 });
    var LEFT = renderer.applyInverseCoordinateTransformUnscaled({ x: 0, y: -1 });
    var RIGHT = renderer.applyInverseCoordinateTransformUnscaled({ x: 0, y: 1 });
    // the diagonals are different than just adding two vectors together, because we are using a transformed screenspace
    var UP_LEFT = { x: 0, y: 1 };
    var DOWN_RIGHT = { x: 0, y: -1 };
    var DOWN_LEFT = { x: -1, y: 0 };
    var UP_RIGHT = { x: 1, y: 0 };

    self.step = function step() {
        var scratch = physics.scratchpad();
        var newTarget = scratch.vector().zero();

        if (playerKeys[87] && playerKeys[65] && !playerKeys[83] && !playerKeys[68]) {
            // w + a
            interruptAction();
            newTarget.clone(UP_LEFT);
        } else if (playerKeys[87] && playerKeys[68] && !playerKeys[65] && !playerKeys[83]) {
            // w + d
            interruptAction();
            newTarget.clone(UP_RIGHT);
        } else if (playerKeys[83] && playerKeys[68] && !playerKeys[87] &&!playerKeys[65]) {
            // s + d
            interruptAction();
            newTarget.clone(DOWN_RIGHT);
        } else if (playerKeys[83] && playerKeys[65] && !playerKeys[87] && !playerKeys[68]) {
            // s + a
            interruptAction();
            newTarget.clone(DOWN_LEFT);
        } else if (playerKeys[65]) {
            // a
            interruptAction();
            newTarget.clone(LEFT);
        } else if (playerKeys[68]) {
            // d
            interruptAction();
            newTarget.clone(RIGHT);
        } else if (playerKeys[87]) {
            // w
            interruptAction();
            newTarget.clone(UP);
        } else if (playerKeys[83]) {
            // s
            interruptAction();
            newTarget.clone(DOWN);
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
                attack(clickData, constants.weapons.MELEE.id);
            } else if (clickData.button === 1) {
                attack(clickData, constants.weapons.RIFLE.id);
            }
        }

        newTarget.rotate(Math.PI / 2);

        setPlayerVelocity(newTarget);
        setPlayerOrientation(renderer.mouse);

        scratch.done();
    };

    function attack(clickData, weaponId) {
        if (player) {
            ClientActions.attack({ x: clickData.x, y: clickData.y }, weaponId);
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
module.exports.$inject = ['$container', 'lib/physicsjs', 'ClientActions', 'Pathfinder', 'lib/pixi.js', 'World', 'Game', 'system/Renderer', 'system/Effects', 'Constants'];
