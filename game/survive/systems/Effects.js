"use strict";
var now = require('performance-now');

function Effects(pixi, physics, game) {
    var self = this;
    var GFX_SCALE = 20; // https://github.com/GoodBoyDigital/pixi.js/issues/1306

    var spritesUnderEffect = [];

    self.step = function step() {
        if (spritesUnderEffect.length === 0) {
            return;
        }

        var index, entry;
        var currentTime = now();
        var scratch = physics.scratchpad();
        var pathVec = scratch.vector();
        var dir = scratch.vector();
        var newPos = scratch.vector();
        var dist;
        for (index = 0; index < spritesUnderEffect.length; /* nop */) {
            entry = spritesUnderEffect[index];
            if (currentTime - entry.startTime > entry.duration) {
                game.events.emit('removeGraphics', entry.sprite);
                spritesUnderEffect.splice(index, 1);
                // removed from array, so don't increment index
            } else {
                newPos.clone(entry.start);
                pathVec.clone(entry.end).vsub(newPos);
                dist = pathVec.norm();
                dir.clone(pathVec).normalize();
                newPos.vadd(dir.mult(dist * ((currentTime - entry.startTime) / entry.duration)));
                entry.sprite.position.x = newPos.x * GFX_SCALE;
                entry.sprite.position.y = newPos.y * -1 * GFX_SCALE;

                if (entry.alpha) {
                    entry.sprite.alpha = (entry.alpha.end - entry.alpha.start) * ((currentTime - entry.startTime) / entry.duration) + entry.alpha.start;
                }

                index++;
            }
        }
        scratch.done();
    };

    self.drawChargeLaser = function drawChargeLaser(source, destination) {
        var scratch = physics.scratchpad();
        var sprite = new pixi.Sprite.fromImage('images/laser_rounded_charge2.png');
        sprite.anchor.set(0.08, 0.5);
        var sourceRand = randomizePositionInplace(scratch.vector().clone(source), 0.433, 0.75);
        var destRand = randomizePositionInplace(scratch.vector().clone(destination), 0.433, 0.75);
        var vec = destRand.vsub(sourceRand).mult(1.16);
        sprite.rotation = vec.angle() * -1;
        sprite.position.x = sourceRand.x * GFX_SCALE;
        sprite.position.y = sourceRand.y * -1 * GFX_SCALE;
        sprite.scale.x = GFX_SCALE / 170 /*px*/ * vec.norm();
        sprite.scale.y = GFX_SCALE / 40 / 2;
        sprite.blendMode = pixi.BLEND_MODES.ADD;
        sprite.layer = 9;
        game.events.emit('addGraphics', sprite);
        setTimeout(function () {
            game.events.emit('removeGraphics', sprite);
        }, 500);
        scratch.done();
    };

    self.drawHealLaser = function drawHealLaser(source, destination) {
        var scratch = physics.scratchpad();
        var sprite = new pixi.Sprite.fromImage('images/laser_rounded_heal.png');
        sprite.anchor.set(0.08, 0.5);
        var sourceRand = randomizePositionInplace(scratch.vector().clone(source), 0, 0);
        var destRand = randomizePositionInplace(scratch.vector().clone(destination), 0.433, 0.75);
        var vec = destRand.vsub(sourceRand).mult(1.16);
        sprite.rotation = vec.angle() * -1;
        sprite.position.x = sourceRand.x * GFX_SCALE;
        sprite.position.y = sourceRand.y * -1 * GFX_SCALE;
        sprite.scale.x = GFX_SCALE / 170 /*px*/ * vec.norm();
        sprite.scale.y = GFX_SCALE / 40 / 2;
        sprite.blendMode = pixi.BLEND_MODES.ADD;
        sprite.layer = 9;
        game.events.emit('addGraphics', sprite);
        setTimeout(function () {
            game.events.emit('removeGraphics', sprite);
        }, 500);
        scratch.done();
    };

    self.drawAttackProjectile = function drawAttackProjectile(sourceEntity, targetEntity) {
        var sprite = new pixi.Sprite.fromImage('images/simple_projectile.png');
        sprite.anchor.set(0.5, 0.5);
        sprite.position.x = sourceEntity.components.placement.position.x * GFX_SCALE;
        sprite.position.y = sourceEntity.components.placement.position.y * -1 * GFX_SCALE;
        sprite.scale.x = GFX_SCALE / 30;
        sprite.scale.y = GFX_SCALE / 30;
        sprite.layer = 9;
        spritesUnderEffect.push({
            sprite: sprite,
            start: sourceEntity.components.placement.position,
            end: targetEntity.components.placement.position,
            startTime: now(),
            duration: 100
        });
        game.events.emit('addGraphics', sprite);
    };

    self.drawCombatText = function drawCombatText(entity, text, format) {
        var sprite = new pixi.MultiStyleText(text, format);
        sprite.anchor.set(0.5, 0.5);
        sprite.position.x = entity.components.placement.position.x * GFX_SCALE;
        sprite.position.y = entity.components.placement.position.y * -1 * GFX_SCALE;
        sprite.scale.x = GFX_SCALE / 40;
        sprite.scale.y = GFX_SCALE / 40;
        sprite.layer = 10;
        var pos = { x: entity.components.placement.position.x, y: entity.components.placement.position.y + 1 };
        var endPos = { x: pos.x, y: pos.y + 1 };
        spritesUnderEffect.push({
            sprite: sprite,
            start: pos,
            alpha: {
                start: 1,
                end: 0
            },
            end: endPos,
            startTime: now(),
            duration: 800
        });
        game.events.emit('addGraphics', sprite);
    };

    function randomizePositionInplace(pos, xdelta, ydelta) {
        pos.x = pos.x + Math.random() * xdelta * 2 - xdelta;
        pos.y = pos.y + Math.random() * ydelta * 2 - ydelta;
        return pos;
    }
}

module.exports = Effects;
module.exports.$inject = ['lib/pixi.js', 'lib/physicsjs', 'Game'];
