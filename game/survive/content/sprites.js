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
        sprite.layer = 2;
        return [sprite];
    });
    modelComponent.registerSpriteLoader('floor', function () {
        var sprite = spriteFromGenericHex("images/iso_dirt_z1.png");
        sprite.layer = 0;

        return [sprite];
    });
    modelComponent.registerSpriteLoader('wall', function () {
        var sprite = spriteFromGenericHex("images/iso_wall_z0_5.png");
        sprite.layer = 1;

        var spriteTop = spriteFromGenericHex("images/iso_wall_z1_5.png");
        spriteTop.layer = 3;

        return [sprite, spriteTop];
    });
    modelComponent.registerSpriteLoader('genericEnemy', function () {
        var sprite = new pixi.Sprite(pixi.Texture.fromImage("images/enemy1.png"));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 1.7320507999999961 * GFX_SCALE / 60 /*px*/;
        sprite.scale.y = 2 * GFX_SCALE / 60 /*px*/;
        sprite.layer = 2;
        return [sprite];
    });

    function spriteFromGenericHex(path) {
        var sprite = new pixi.Sprite(pixi.Texture.fromImage(path));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = GFX_SCALE / 30;
        sprite.scale.y = GFX_SCALE / 30;
        return sprite;
    }
}

module.exports = {
    register: register
};
