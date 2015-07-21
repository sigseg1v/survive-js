"use strict";
//var td = require('throttle-debounce');

function Renderer(Placement, Model, Lightsource, pixi, domLoaded, game) {
    var self = this;

    var GFX_SCALE = 20; // https://github.com/GoodBoyDigital/pixi.js/issues/1306

    self.GFX_SCALE = GFX_SCALE;
    self.width = 1280;
    self.height = 720;

    function applyCoordinateTransform(target, x, y) {
        if (x === undefined) {
            x = target.x;
        }
        if (y === undefined) {
            y = target.y;
        }
        x *= GFX_SCALE;
        y *= GFX_SCALE * -1;
        target.x = x - y;
        target.y = (x + y) / 2;
    }

    function applyInverseCoordinateTransform(target, x, y) {
        if (x === undefined) {
            x = target.x;
        }
        if (y === undefined) {
            y = target.y;
        }

        target.x = x / 2 + y;
        target.y = y - (x / 2);
        target.x /= GFX_SCALE;
        target.y /= GFX_SCALE * -1;
    }

    function applyCoordinateTransformUnscaled(target, x, y) {
        if (x === undefined) {
            x = target.x;
        }
        if (y === undefined) {
            y = target.y;
        }
        y *= -1;
        target.x = x - y;
        target.y = (x + y) / 2;
    }

    function applyInverseCoordinateTransformUnscaled(target, x, y) {
        if (x === undefined) {
            x = target.x;
        }
        if (y === undefined) {
            y = target.y;
        }

        target.x = x / 2 + y;
        target.y = y - (x / 2);
        target.y *= -1;
    }

    self.applyCoordinateTransform = applyCoordinateTransform;
    self.applyInverseCoordinateTransform = applyInverseCoordinateTransform;
    self.applyCoordinateTransformUnscaled = applyCoordinateTransformUnscaled;
    self.applyInverseCoordinateTransformUnscaled = applyInverseCoordinateTransformUnscaled;

    var renderer = pixi.autoDetectRenderer(self.width, self.height);
    //var addOrder = 0;

    self.renderer = renderer;
    self.stage = new pixi.Container(0x272b30);
    //self.stage.rotation = - Math.PI / 3;
    self.world = new pixi.Container();
    self.worldOffset = { x: -3 , y: -6 };

    // make 10 layers for the world
    (function generateWorldLayers() {
        for (var i = 0; i < 10; i++) {
            self.world.addChild(new pixi.Container());
        }
    })();

    self.zoom = 1;
    self.focus = null;

    var lightmapRenderer = new pixi.RenderTexture(renderer, self.width, self.height);
    var lightmapWorldWrapper = new pixi.Container();
    var lightmapWorld = new pixi.Container();
    var lightmapStage = new pixi.Sprite(lightmapRenderer);
    lightmapWorldWrapper.addChild(lightmapWorld);
    lightmapRenderer.render(lightmapWorldWrapper);
    self.stage.addChild(lightmapStage);

    game.events.on('dayNightCycle:day', function (data) {
        self.world.mask = null;
    });
    game.events.on('dayNightCycle:night', function (data) {
        self.world.mask = lightmapStage;
    });

    self.stage.addChild(self.world);

    domLoaded.then(function () {
        document.getElementById('game-viewport').appendChild(renderer.view);
    });

    //var throttledSort = td.throttle(200, false, zSort, true);

    game.events.on('addEntity', onAddEntity);
    game.events.on('removeEntity', onRemoveEntity);
    game.events.on('addGraphics', onAddGraphics);
    game.events.on('removeGraphics', onRemoveGraphics);
    game.events.on('addLightsource', onAddLightsource);
    game.events.on('removeLightsource', onRemoveLightsource);

    function isValidLayer(layer) {
        return !(layer < 0 || layer > 10);
    }

    function onAddEntity(entity) {
        var graphics;
        if (entity.components.model.sprites) {
            for (var i = 0, len = entity.components.model.sprites.length; i < len; i++) {
                graphics = entity.components.model.sprites[i];
                if (!graphics.hasOwnProperty('layer')) {
                    graphics.layer = 2;
                }
                if (!isValidLayer(graphics.layer)) {
                    throw "The layer " + graphics.layer + " is invalid.";
                }
                computeZFromWorldPosition(entity.components.placement.position, graphics, true);
                addInPosition(graphics);
            }
        }
    }

    function onRemoveEntity(entity) {
        if (entity.components.model.sprites) {
            for (var i = 0, len = entity.components.model.sprites.length; i < len; i++) {
                onRemoveGraphics(entity.components.model.sprites[i]);
            }
        }
    }

    function onAddLightsource(sprite) {
        if (sprite) {
            lightmapWorld.addChild(sprite);
        }
    }

    function onRemoveLightsource(sprite) {
        if (sprite) {
            lightmapWorld.removeChild(sprite);
        }
    }

    function onAddGraphics(graphics) {
        if (!graphics.hasOwnProperty('layer')) {
            graphics.layer = 2;
        }
        if (!isValidLayer(graphics.layer)) {
            throw "The layer " + graphics.layer + " is invalid.";
        }
        if (graphics.hasOwnProperty('staticPosition')) {
            computeZFromWorldPosition(graphics.staticPosition, graphics, true);
            applyCoordinateTransform(graphics.position, graphics.staticPosition.x, graphics.staticPosition.y);
        }
        addInPosition(graphics);
    }

    function onRemoveGraphics(item) {
        var layerContainer = self.world.children[item.layer];
        if (layerContainer) {
            layerContainer.removeChild(item);
        }
    }

    function computeZFromWorldPosition(worldPosition, graphics, skipReposition) {
        var newZ = worldPosition.y - worldPosition.x;
        if (graphics.z !== newZ) {
            graphics.z = newZ;
            if (!skipReposition) {
                reposition(graphics);
            }
        }
    }

    function findPosition(graphics) {
        // binary search to find insertion point
        var bsFound, bsArray, bsCurrentIndex, bsMinIndex, bsMaxIndex, bsCurrentElement;//, bsRow, gfxRow;
        bsArray = self.world.children[graphics.layer].children;
        bsCurrentIndex = 0;
        bsMinIndex = 0;
        bsMaxIndex = bsArray.length - 1;
        bsFound = false;
        while (bsMinIndex <= bsMaxIndex) {
            bsCurrentIndex = (bsMinIndex + bsMaxIndex) / 2 | 0;
            bsCurrentElement = bsArray[bsCurrentIndex];
            if (bsCurrentElement.z > graphics.z) {
                bsMinIndex = bsCurrentIndex + 1;
            } else if (bsCurrentElement.z < graphics.z) {
                bsMaxIndex = bsCurrentIndex - 1;
            } else {
                bsFound = true;
                break;
            }
        }

        return Math.max(Math.min(bsFound ? bsCurrentIndex : bsMinIndex, bsArray.length - 1), 0);
    }

    function addInPosition(graphics) {
        self.world.children[graphics.layer].addChildAt(graphics, findPosition(graphics));
    }

    function reposition(graphics) {
        var layer = self.world.children[graphics.layer];
        if (graphics.parent !== layer) {
            return;
        }
        var index = layer.getChildIndex(graphics);
        var newIndex = findPosition(graphics);
        if (index !== newIndex) {
            layer.setChildIndex(graphics, newIndex);
        }
    }

    self.step = function step() {
        var i, l, j, jl, entity, sprites, sprite, placement, scale;

        self.world.scale.x = self.zoom / GFX_SCALE;
        self.world.scale.y = self.zoom / GFX_SCALE;
        lightmapWorld.scale.x = self.zoom / GFX_SCALE;
        lightmapWorld.scale.y = self.zoom / GFX_SCALE;
        if (self.focus) {
            applyCoordinateTransform(self.world.position, ((self.focus.x + self.worldOffset.x) * self.zoom * -1 + (self.width / 2)) / GFX_SCALE, ((self.focus.y + self.worldOffset.y) * self.zoom * 1 + (self.height / 2)) / GFX_SCALE * -1);
            applyCoordinateTransform(lightmapWorld.position, ((self.focus.x + self.worldOffset.x) * self.zoom * -1 + (self.width / 2)) / GFX_SCALE, ((self.focus.y + self.worldOffset.y) * self.zoom * 1 + (self.height / 2)) / GFX_SCALE * -1);
            // self.world.position.x = self.focus.x * self.zoom * -1 + (self.width / 2);
            // self.world.position.y = self.focus.y * self.zoom * 1 + (self.height / 2);
            // lightmapWorld.position.x = self.focus.x * self.zoom * -1 + (self.width / 2);
            // lightmapWorld.position.y = self.focus.y * self.zoom * 1 + (self.height / 2);
        }

        for (i = 0, l = Model.entities.length; i < l; ++i) {
            entity = Model.entities[i];
            placement = entity.components.placement;
            if (placement) {
                sprites = entity.components.model.sprites;
                for (j = 0, jl = sprites.length; j < jl; j++) {
                    sprite = sprites[j];
                    computeZFromWorldPosition(placement.position, sprite);
                    applyCoordinateTransform(sprite.position, placement.position.x, placement.position.y);
                    // sprite.position.x = placement.position.x * GFX_SCALE;
                    // sprite.position.y = placement.position.y * -1 * GFX_SCALE;
                    sprite.rotation = placement.orientation * -1;
                }
            }
        }

        for (i = 0, l = Lightsource.entities.length; i < l; ++i) {
            entity = Lightsource.entities[i];
            sprite = entity.components.lightsource.sprite;
            placement = entity.components.placement;
            if (sprite) {
                scale = entity.components.lightsource.scale;
                if (sprite.scale.x !== scale) {
                    sprite.scale.x = scale;
                }
                if (sprite.scale.y !== scale) {
                    sprite.scale.y = scale;
                }
                applyCoordinateTransform(sprite.position, placement.position.x,  placement.position.y);
                // sprite.position.x = placement.position.x * GFX_SCALE;
                // sprite.position.y = placement.position.y * -1 * GFX_SCALE;
            }
        }
        lightmapRenderer.clear();
        lightmapRenderer.render(lightmapWorldWrapper);

        renderer.render(self.stage);
    };

    Object.defineProperty(this, 'mouse', {
        get: function () { return renderer.plugins.interaction.mouse; }
    });
}

module.exports = Renderer;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Lightsource', 'lib/pixi.js', 'documentReady', 'Game'];
