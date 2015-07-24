"use strict";
var now = require('performance-now');

function Effects(pixi, physics, game, renderer, Model) {
    var self = this;
    var GFX_SCALE = 20; // https://github.com/GoodBoyDigital/pixi.js/issues/1306

    var spritesUnderEffect = [];

    // data:
    //      sourceEntity
    //      targetEntity
    //      sourcePoint
    //      targetPoint
    var spellEffects = {
        0: function meleeAttack(data) {
            var scratch = physics.scratchpad();
            var sprite = Model.createSprites('attack_swing')[0];
            var sourceScreenspace = renderer.applyCoordinateTransformUnscaled(new pixi.Point(data.sourcePoint.x, data.sourcePoint.y));
            var targetScreenspace = renderer.applyCoordinateTransformUnscaled(new pixi.Point(data.targetPoint.x, data.targetPoint.y));
            var angle = scratch.vector().clone(targetScreenspace).vsub(scratch.vector().clone(sourceScreenspace)).angle();
            sprite.anchor.set(0, 0.5);
            sprite.staticPosition = {
                x: data.sourcePoint.x,
                y: data.sourcePoint.y
            };
            sprite.scale.x = GFX_SCALE / 30;
            sprite.scale.y = GFX_SCALE / 30;
            sprite.rotation = angle;
            sprite.layer = 9;
            sprite.loop = false;
            sprite.animationSpeed = 1.6;
            spritesUnderEffect.push({
                sprite: sprite,
                start: sprite.staticPosition,
                end: sprite.staticPosition,
                startTime: now(),
                duration: 'end'
            });
            game.events.emit('addGraphics', sprite);
            sprite.play();
            scratch.done();
        }
    };

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
            if ((entry.duration === 'end' && !entry.sprite.playing) || currentTime - entry.startTime > entry.duration) {
                game.events.emit('removeGraphics', entry.sprite);
                spritesUnderEffect.splice(index, 1);
                // removed from array, so don't increment index
            } else if (entry.duration === 'end' && entry.sprite.playing) {
                index++;
            } else {
                newPos.clone(entry.start);
                pathVec.clone(entry.end).vsub(newPos);
                dist = pathVec.norm();
                dir.clone(pathVec).normalize();
                newPos.vadd(dir.mult(dist * ((currentTime - entry.startTime) / entry.duration)));
                renderer.applyCoordinateTransform(entry.sprite.position, newPos.x, newPos.y);

                if (entry.alpha) {
                    entry.sprite.alpha = (entry.alpha.end - entry.alpha.start) * ((currentTime - entry.startTime) / entry.duration) + entry.alpha.start;
                }

                index++;
            }
        }
        scratch.done();
    };

    self.drawLocationDebugSprite = function drawAttackProjectile(position) {
        var sprite = new pixi.Sprite.fromImage('images/simple_projectile.png');
        sprite.anchor.set(0.5, 0.5);
        sprite.staticPosition = {
            x: position.x,
            y: position.y
        };
        sprite.scale.x = GFX_SCALE / 30;
        sprite.scale.y = GFX_SCALE / 30;
        sprite.layer = 9;
        spritesUnderEffect.push({
            sprite: sprite,
            start: position,
            end: position,
            startTime: now(),
            duration: 100
        });
        game.events.emit('addGraphics', sprite);
    };

    self.drawSpellEffect = function drawSpellEffect(sourceEntity, target, spellId) {
        var targetPoint;
        var targetEntity;
        var sourcePoint = sourceEntity && sourceEntity.components.placement ? sourceEntity.components.placement.position : null;
        if (target.hasOwnProperty('x') && target.hasOwnProperty('y')) {
            targetEntity = null;
            targetPoint = target;
        } else if (target.hasOwnProperty('id')) {
            targetEntity = target;
            targetPoint = targetEntity.components.placement.position;
        } else {
            return;
        }
        return spellEffects[spellId].call(null, {
            sourceEntity: sourceEntity,
            targetEntity: targetEntity,
            sourcePoint: sourcePoint,
            targetPoint: targetPoint
        });
    };

    self.drawCombatText = function drawCombatText(entity, text, format) {
        var sprite = new pixi.MultiStyleText(text, format);
        sprite.anchor.set(0.5, 0.5);
        sprite.scale.x = GFX_SCALE / 40;
        sprite.scale.y = GFX_SCALE / 40;
        sprite.layer = 9;
        var difference = { x: 0, y: -1 };
        renderer.applyInverseCoordinateTransformUnscaled(difference);
        var pos = { x: entity.components.placement.position.x + difference.x, y: entity.components.placement.position.y + difference.y };
        var endPos = { x: pos.x + difference.x, y: pos.y + difference.y };
        renderer.applyCoordinateTransform(sprite.position, pos.x, pos.y);
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
module.exports.$inject = ['lib/pixi.js', 'lib/physicsjs', 'Game', 'system/Renderer', 'component/Model'];
