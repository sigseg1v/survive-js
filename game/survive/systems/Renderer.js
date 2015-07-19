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
        target.x = x + y;
        target.y = y * 2 - x;
    }

    self.applyCoordinateTransform = applyCoordinateTransform;
    self.applyInverseCoordinateTransform = applyInverseCoordinateTransform;

    var renderer = pixi.autoDetectRenderer(self.width, self.height);
    //var addOrder = 0;

    self.renderer = renderer;
    self.stage = new pixi.Container(0x272b30);
    //self.stage.rotation = - Math.PI / 3;
    self.world = new pixi.Container();
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

    function onAddEntity(entity) {
        if (entity.components.model.sprites) {
            for (var i = 0, len = entity.components.model.sprites.length; i < len; i++) {
                onAddGraphics(entity.components.model.sprites[i]);
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

    function onAddGraphics(item) {
        addInPosition(item);
    }

    function onRemoveGraphics(item) {
        self.world.removeChild(item);
    }

    function addInPosition(graphics) {
        if (!graphics.hasOwnProperty('zIndex')) {
            graphics.zIndex = 1;
            //graphics.addOrder = addOrder++;
        }
        if (graphics.hasOwnProperty('staticPosition')) {
            applyCoordinateTransform(graphics.position, graphics.staticPosition.x * GFX_SCALE, graphics.staticPosition.y * -1 * GFX_SCALE);
            // graphics.position.x = graphics.staticPosition.x * GFX_SCALE;
            // graphics.position.y = graphics.staticPosition.y * -1 * GFX_SCALE;
        }

        // binary search to find insertion point
        var bsFound, bsArray, bsCurrentIndex, bsMinIndex, bsMaxIndex, bsCurrentElement;//, bsRow, gfxRow;
        bsArray = self.world.children;
        bsCurrentIndex = 0;
        bsMinIndex = 0;
        bsMaxIndex = bsArray.length - 1;
        bsFound = false;
        //gfxRow = getRow(graphics.position);
        while (bsMinIndex <= bsMaxIndex) {
            bsCurrentIndex = (bsMinIndex + bsMaxIndex) / 2 | 0;
            bsCurrentElement = bsArray[bsCurrentIndex];
            if (bsCurrentElement.zIndex < graphics.zIndex) {
                bsMinIndex = bsCurrentIndex + 1;
            } else if (bsCurrentElement.zIndex > graphics.zIndex) {
                bsMaxIndex = bsCurrentIndex - 1;
            } else {
                // bsRow = getRow(bsCurrentElement.position);
                // if (bsRow < gfxRow) {
                //     bsMinIndex = bsCurrentIndex + 1;
                // } else if (gfxRow > bsRow) {
                //     bsMaxIndex = bsCurrentIndex - 1;
                // } else {
                //     // item found, stop search
                //    break;
                // }
                bsFound = true;
                break;
            }
        }

        self.world.addChildAt(graphics, bsFound ? bsCurrentIndex : bsMinIndex);
        //throttledSort();
    }

    // function getRow(pos) {
    //     var x = pos.x / GFX_SCALE;
    //     var y = pos.y / GFX_SCALE;
    //     var _q = 1 / 3.0 * 1.7320508075 * x - 1 / 3.0 * y;
    //     var _r = 2 / 3.0 * y;
    //     var _y = -_q - _r;
    //
    //     var rx = Math.round(_q);
    //     var ry = Math.round(_y);
    //     var rz = Math.round(_r);
    //
    //     var x_err = Math.abs(rx - _q);
    //     var y_err = Math.abs(ry - _y);
    //     var z_err = Math.abs(rz - _r);
    //
    //     return (x_err <= y_err || x_err <= z_err || y_err <= z_err) ? -rx - ry : rz;
    // }

    // function drawOrderCompare(a, b) {
    //     var ra, rb;
    //     if (a.zIndex > b.zIndex) {
    //         return -1;
    //     } else if (a.zIndex < b.zIndex) {
    //         return 1;
    //     } else {
    //         ra = getRow(a.position);
    //         rb = getRow(b.position);
    //         if (ra < rb) {
    //             return -1;
    //         } else if (ra > rb) {
    //             return 1;
    //         } else {
    //             return 0;
    //         }
    //     }
    // }

    // function getCubeCoordinates(x, y, scale) {
    //     scale = scale || 1;
    //     var _q = 1 / 3.0 * 1.7320508075 * x / scale - 1 / 3.0 * y / scale;
    //     var _r = 2 / 3.0 * y / scale;
    //     var _y = -_q - _r;
    //
    //     var rx = Math.round(_q);
    //     var ry = Math.round(_y);
    //     var rz = Math.round(_r);
    //
    //     var x_err = Math.abs(rx - _q);
    //     var y_err = Math.abs(ry - _y);
    //     var z_err = Math.abs(rz - _r);
    //
    //     if (x_err < y_err || x_err < z_err || y_err < z_err)
    //
    //     if (x_err > y_err && x_err > z_err) {
    //     } else if (y_err > z_err) {
    //     } else {
    //         rz = -rx - ry;
    //     }
    //
    //     return rz;
    // }

    // function zSort() {
    //     console.log('zsorting');
    //     self.world.children.sort(function (a, b) {
    //         if (a.zIndex == b.zIndex) {
    //             return 0;
    //         }
    //         if (a.zIndex > b.zIndex) return 1;
    //         return -1;
    //     });
    // }

    self.step = function step() {
        var i, l, j, jl, entity, sprites, sprite, placement, scale;

        self.world.scale.x = self.zoom / GFX_SCALE;
        self.world.scale.y = self.zoom / GFX_SCALE;
        lightmapWorld.scale.x = self.zoom / GFX_SCALE;
        lightmapWorld.scale.y = self.zoom / GFX_SCALE;
        if (self.focus) {
            applyCoordinateTransform(self.world.position, self.focus.x * self.zoom * -1 + (self.width / 2), self.focus.y * self.zoom * 1 + (self.height / 2));
            applyCoordinateTransform(lightmapWorld.position, self.focus.x * self.zoom * -1 + (self.width / 2), self.focus.y * self.zoom * 1 + (self.height / 2));
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
                    applyCoordinateTransform(sprite.position, placement.position.x * GFX_SCALE, placement.position.y * -1 * GFX_SCALE);
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
                applyCoordinateTransform(sprite.position, placement.position.x * GFX_SCALE,  placement.position.y * -1 * GFX_SCALE);
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
