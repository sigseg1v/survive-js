"use strict";
var limit = require('../../etc/ratelimiter.js');

function CalculateLighting(game, Lightsource, pixi) {
    var self = this;
    var stepAmount = 16; // this doesn't really need to match the system step, since this system is probably running on requestAnimationFrame

    var entityLightDataMap = {};

    game.events.on('addEntity', onAddEntity);
    game.events.on('removeEntity', onRemoveEntity);

    self.step = function step() {
        var i, l, entity, sprite, data, newCalculated;
        for (i = 0, l = Lightsource.entities.length; i < l; ++i) {
            entity = Lightsource.entities[i];
            data = entityLightDataMap[entity.id];
            sprite = entity.components.lightsource.sprite;
            if (sprite && data) {
                data.wait -= stepAmount;
                if (data.wait <= 0) {
                    data.wait = Math.random() * (400 - 200) + 200;
                    data.rate = Math.random() * (0.1 - 0.01) + 0.01;
                    data.target = Math.random() * (1 - 0.8) + 0.8;
                }

                newCalculated = sprite.alpha + ((data.rate / stepAmount) * (data.increasing ? 1 : -1));
                if (newCalculated > 1) {
                    newCalculated = 1;
                    data.increasing = !data.increasing;
                } else if (newCalculated < 0) {
                    newCalculated = 0;
                    data.increasing = !data.increasing;
                } else if ((data.increasing && newCalculated > (data.target + (data.rate / 2))) || (!data.increasing && newCalculated < (data.target - (data.rate / 2)))) {
                    data.increasing = !data.increasing;
                }

                sprite.alpha = newCalculated;
            }
        }
    };

    function LightingData() {
        this.wait = 0;
        this.increasing = false;
        this.target = 1;
        this.rate = 0.1;
    }

    function onAddEntity(entity) {
        if (entity.components.lightsource) {
            var sprite = createLightingSprite();
            entity.components.lightsource.sprite = sprite;
            entityLightDataMap[entity.id] = new LightingData();
            game.events.emit('addLightsource', sprite);
        }
    }

    function onRemoveEntity(entity) {
        if (entity.components.lightsource) {
            var sprite = entity.components.lightsource.sprite;
            if (sprite) {
                game.events.emit('removeLightsource', sprite);
                entity.components.lightsource.sprite = null;
                sprite.destroy();
            }
        }
        delete entityLightDataMap[entity.id];
    }

    function createLightTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        var ctx = canvas.getContext('2d');
        var grad = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.95)");
        grad.addColorStop(0.85, "rgba(255,255,255,0.5)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 200, 200);
        var texture = pixi.Texture.fromCanvas(canvas);
        pixi.Texture.addTextureToCache(texture, 'lightTexture');
        return texture;
    }

    function createLightingSprite() {
        var texture = pixi.utils.TextureCache.lightTexture || createLightTexture();
        var sprite = new pixi.Sprite(texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        return sprite;
    }
}

module.exports = CalculateLighting;
module.exports.$inject = [ 'Game', 'component/Lightsource', 'lib/pixi.js' ];
