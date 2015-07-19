"use strict";

function register(container) {
    var GFX_SCALE = 20; // https://github.com/GoodBoyDigital/pixi.js/issues/1306
    var pixi = container.resolve('lib/pixi.js');
    var modelComponent = container.resolve('component/Model');
    modelComponent.registerSpriteLoader('player', function () {
        var sprite = new pixi.Sprite(pixi.Texture.fromImage("images/player_ship.png"));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 1.7320507999999961 * GFX_SCALE / 60 /*px*/;
        sprite.scale.y = 2 * GFX_SCALE / 60 /*px*/;
        sprite.zIndex = 1;
        return [sprite];
    });
    modelComponent.registerSpriteLoader('floor', function () {
        var sprite = spriteFromGenericHex("images/tileStone_full_top.png");
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.3595;
        sprite.zIndex = 0;
        return [sprite];
    });
    modelComponent.registerSpriteLoader('wall', function () {
        var sprite = spriteFromGenericHex("images/tileRock_full.png");
        sprite.zIndex = 0.5;

        var spriteTop = spriteFromGenericHex("images/tileRock_full_top.png");
        spriteTop.zIndex = 1.5;

        return [sprite, spriteTop];
    });
    modelComponent.registerSpriteLoader('base', function () {
        var sprite = spriteFromGenericHex("images/generic_building_base.png");
        sprite.anchor.y = 0.61;
        sprite.zIndex = 0.5;

        var spriteTop = spriteFromGenericHex("images/building_top_blue.png");
        spriteTop.anchor.y = 0.61;
        spriteTop.zIndex = 1.5;

        var spriteTopPoint = spriteFromGenericHex("images/building_top_point_blue.png");
        spriteTopPoint.anchor.y = 0.61;
        spriteTopPoint.zIndex = 2.5;

        return [sprite, spriteTop, spriteTopPoint];
    });
    modelComponent.registerSpriteLoader('tank', function () {
        var sprite = spriteFromGenericHex("images/tileSand_full.png");
        sprite.zIndex = 0.5;

        var spriteTop = spriteFromGenericHex("images/tileSand_full_top.png");
        spriteTop.zIndex = 1.5;

        return [sprite, spriteTop];
    });
    modelComponent.registerSpriteLoader('generator', function () {
        var sprite = spriteFromGenericHex("images/generic_building_base.png");
        sprite.anchor.y = 0.61;
        sprite.zIndex = 0.5;

        var spriteTop = spriteFromGenericHex("images/building_top_red.png");
        spriteTop.anchor.y = 0.61;
        spriteTop.zIndex = 1.5;

        var spriteTopPoint = spriteFromGenericHex("images/building_top_point_red.png");
        spriteTopPoint.anchor.y = 0.61;
        spriteTopPoint.zIndex = 2.5;

        return [sprite, spriteTop, spriteTopPoint];
    });
    modelComponent.registerSpriteLoader('healer', function () {
        var sprite = spriteFromGenericHex("images/generic_building_base.png");
        sprite.anchor.y = 0.61;
        sprite.zIndex = 0.5;

        var spriteTop = spriteFromGenericHex("images/building_top_green.png");
        spriteTop.anchor.y = 0.61;
        spriteTop.zIndex = 1.5;

        var spriteTopPoint = spriteFromGenericHex("images/building_top_point_green.png");
        spriteTopPoint.anchor.y = 0.61;
        spriteTopPoint.zIndex = 2.5;

        return [sprite, spriteTop, spriteTopPoint];
    });
    modelComponent.registerSpriteLoader('cannon', function () {
        var sprite = spriteFromGenericHex("images/generic_building_base.png");
        sprite.anchor.y = 0.61;
        sprite.zIndex = 0.5;

        var spriteTop = spriteFromGenericHex("images/building_top_purple.png");
        spriteTop.anchor.y = 0.61;
        spriteTop.zIndex = 1.5;

        var spriteTopPoint = spriteFromGenericHex("images/building_top_point_purple.png");
        spriteTopPoint.anchor.y = 0.61;
        spriteTopPoint.zIndex = 2.5;

        return [sprite, spriteTop, spriteTopPoint];
    });
    modelComponent.registerSpriteLoader('build-marker', function () {
        var sprite = new pixi.Sprite(pixi.Texture.fromImage("images/build_marker.png"));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 1.7320507999999961 * GFX_SCALE / 100 /*px*/ * 1.2;
        sprite.scale.y = 2 * GFX_SCALE / 120 /*px*/ * 1.2;
        sprite.zIndex = 2;
        return [sprite];
    });
    modelComponent.registerSpriteLoader('genericEnemy', function () {
        var sprite = new pixi.Sprite(pixi.Texture.fromImage("images/enemy1.png"));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 1.7320507999999961 * GFX_SCALE / 60 /*px*/;
        sprite.scale.y = 2 * GFX_SCALE / 60 /*px*/;
        sprite.zIndex = 1;
        return [sprite];
    });
    [
        'red',
        'green',
        'blue',
        'purple'
    ].forEach(function (type) {
        modelComponent.registerSpriteLoader(type + '-mineral', function () {
            var sprite = spriteFromGenericHex("images/" + type + "_mineral_full.png");
            sprite.zIndex = 0.5;

            var spriteTop = spriteFromGenericHex("images/" + type + "_mineral_full_top.png");
            spriteTop.zIndex = 1.5;

            return [sprite, spriteTop];
        });
    });

    function spriteFromGenericHex(path) {
        var sprite = new pixi.Sprite(pixi.Texture.fromImage(path));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = GFX_SCALE / 36;
        sprite.scale.y = GFX_SCALE / 33;
        return sprite;
    }
}

module.exports = {
    register: register
};
