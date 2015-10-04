"use strict";
var now = require('performance-now');
var weakmap = require('weakmap');

var entityControlledSpritesMap = new weakmap();

function getSpriteDataFor(entity, type) {
    if (!entityControlledSpritesMap.has(entity)) {
        entityControlledSpritesMap.set(entity, new EntitySpriteData());
    }
    return entityControlledSpritesMap.get(entity)[type];
}
function setSpriteDataFor(entity, type, value) {
    if (!entityControlledSpritesMap.has(entity)) {
        entityControlledSpritesMap.set(entity, new EntitySpriteData());
    }
    entityControlledSpritesMap.get(entity)[type] = value;
}
function removeSpriteUnderEntity(entity, type) {
    if (entityControlledSpritesMap.has(entity)) {
        var data = entityControlledSpritesMap.get(entity);
        var sprite = data[type];
        data[type] = null;
        return sprite;
    }
}

function EntitySpriteData() {
    this.castbar = null;
}

function Effects(container, pixi, physics, game, renderer, Model) {
    var self = this;

    var spritesUnderEffect = [];

    game.events.on('cast:start', function () {
    });
    game.events.on('cast:update', function (data) {
        self.drawCastBar(data.entity, data.val, data.total, 0x2DBDED);
    });
    game.events.on('cast:end', function (data) {
        self.destroyCastBar(data.entity);
    });

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
        },
        1: function rangedAttack(data) {
            var scratch = physics.scratchpad();
            var sprite = Model.createSprites('bullet_trail')[0];
            var sourceScreenspace = renderer.applyCoordinateTransformUnscaled(new pixi.Point(data.sourcePoint.x, data.sourcePoint.y));
            // targetPoint for ranged attack is the vector of the shot, so we have to add the source point to it
            var targetSegment = scratch.vector().clone(data.targetPoint);

            // calculate what the length of the ray should be and set the sprites width (it extends in the x direction)
            var screenspaceBaseLen = scratch.vector().clone(renderer.applyInverseCoordinateTransform(new pixi.Point(sprite.width, 0))).norm();
            var realSegmentLen = targetSegment.norm();
            sprite.width *= (realSegmentLen / screenspaceBaseLen);

            var targetVector = scratch.vector().clone(data.targetPoint).add(data.sourcePoint.x, data.sourcePoint.y);
            var targetScreenspace = renderer.applyCoordinateTransformUnscaled(new pixi.Point(targetVector.x, targetVector.y));
            var angle = scratch.vector().clone(targetScreenspace).vsub(scratch.vector().clone(sourceScreenspace)).angle();
            sprite.anchor.set(0, 0.5);
            sprite.staticPosition = {
                x: data.sourcePoint.x,
                y: data.sourcePoint.y
            };
            sprite.rotation = angle;
            sprite.layer = 9;
            sprite.loop = false;
            sprite.animationSpeed = 2;
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
                game.events.emit(entry.overlay ? 'removeOverlayGraphics' : 'removeGraphics', entry.sprite);
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
        sprite.scale.x = 1;
        sprite.scale.y = 1;
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
        sprite.scale.x = 1 / 2;
        sprite.scale.y = 1 / 2;
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
            duration: 800,
            overlay: true
        });
        game.events.emit('addOverlayGraphics', sprite);
    };

    self.drawCastBar = function drawCastBar(entity, value, total, color) {
        var graphics = getSpriteDataFor(entity, 'castbar');
        if (!graphics) {
            graphics = container.resolve('Graphics');
            game.events.emit('addOverlayGraphics', graphics.data);
            graphics.offset.y = 1;
            graphics.offset.x = -0.5;
            setSpriteDataFor(entity, 'castbar', graphics);
        }
        graphics.data.clear();
        graphics.data.beginFill(0x000000);
        graphics.drawRect(entity.components.placement.position.x, entity.components.placement.position.y, 1, 0.2);
        graphics.data.endFill();

        graphics.data.beginFill(color);
        graphics.drawRect(entity.components.placement.position.x, entity.components.placement.position.y, Math.min(value / total, 1), 0.2);
        graphics.data.endFill();
    };

    self.destroyCastBar = function destroyCastBar(entity) {
        var graphics = removeSpriteUnderEntity(entity, 'castbar');
        if (graphics) {
            game.events.emit('removeOverlayGraphics', graphics.data);
        }
    };
}

module.exports = Effects;
module.exports.$inject = ['$container', 'lib/pixi.js', 'lib/physicsjs', 'Game', 'system/Renderer', 'component/Model'];
