"use strict";

var TilingMovieClip = require('pixi-tiling-movie-clip');
var MultiMovieClip = require('game/engine/presentation/MultiMovieClip');

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
    modelComponent.registerSpriteLoader('attack_swing', function () {
        var frames = [];
        for (var i = 1, len = 12; i <= len; i++) {
            frames.push(pixi.Texture.fromFrame("attack_swing" + (i < 10 ? "0" + i : i) + ".png"));
        }
        var sprite = new pixi.extras.MovieClip(frames);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 1.7320507999999961 * GFX_SCALE / 60 /*px*/;
        sprite.scale.y = 2 * GFX_SCALE / 60 /*px*/;
        sprite.layer = 2;
        sprite.animationSpeed = 0.5;
        return [sprite];
    });
    modelComponent.registerSpriteLoader('bullet_trail', function () {
        var frames = [];
        for (var i = 1, len = 15; i <= len; i++) {
            frames.push(pixi.Texture.fromFrame("bullet_trail" + (i < 10 ? "0" + i : i) + ".png"));
        }
        var sprite = new TilingMovieClip(frames, 128, 4);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 1.7320507999999961 * GFX_SCALE / 60 /*px*/;
        sprite.scale.y = 2 * GFX_SCALE / 60 /*px*/;
        sprite.layer = 2;
        sprite.animationSpeed = 0.5;
        return [sprite];
    });
    modelComponent.registerSpriteLoader('zombie', function () {
        var sprite = new MultiMovieClip({
            "stance_left": getTextureRange('zombie', 'png', 0, 3),
            "walk_left": getTextureRange('zombie', 'png', 4, 11),
            "slam_left": getTextureRange('zombie', 'png', 12, 15),
            "bite_left": getTextureRange('zombie', 'png', 16, 19),
            "block_left": getTextureRange('zombie', 'png', 20, 21),
            "die_left": getTextureRange('zombie', 'png', 22, 27),
            "die_crit_left": getTextureRange('zombie', 'png', 28, 35),
            "stance_up_left": getTextureRange('zombie', 'png', 0 + 36, 3 + 36),
            "walk_up_left": getTextureRange('zombie', 'png', 4 + 36, 11 + 36),
            "slam_up_left": getTextureRange('zombie', 'png', 12 + 36, 15 + 36),
            "bite_up_left": getTextureRange('zombie', 'png', 16 + 36, 19 + 36),
            "block_up_left": getTextureRange('zombie', 'png', 20 + 36, 21 + 36),
            "die_up_left": getTextureRange('zombie', 'png', 22 + 36, 27 + 36),
            "die_crit_up_left": getTextureRange('zombie', 'png', 28 + 36, 35 + 36),
            "stance_up": getTextureRange('zombie', 'png', 0 + 72, 3 + 72),
            "walk_up": getTextureRange('zombie', 'png', 4 + 72, 11 + 72),
            "slam_up": getTextureRange('zombie', 'png', 12 + 72, 15 + 72),
            "bite_up": getTextureRange('zombie', 'png', 16 + 72, 19 + 72),
            "block_up": getTextureRange('zombie', 'png', 20 + 72, 21 + 72),
            "die_up": getTextureRange('zombie', 'png', 22 + 72, 27 + 72),
            "die_crit_up": getTextureRange('zombie', 'png', 28 + 72, 35 + 72),
            "stance_up_right": getTextureRange('zombie', 'png', 0 + 108, 3 + 108),
            "walk_up_right": getTextureRange('zombie', 'png', 4 + 108, 11 + 108),
            "slam_up_right": getTextureRange('zombie', 'png', 12 + 108, 15 + 108),
            "bite_up_right": getTextureRange('zombie', 'png', 16 + 108, 19 + 108),
            "block_up_right": getTextureRange('zombie', 'png', 20 + 108, 21 + 108),
            "die_up_right": getTextureRange('zombie', 'png', 22 + 108, 27 + 108),
            "die_crit_up_right": getTextureRange('zombie', 'png', 28 + 108, 35 + 108),
            "stance_right": getTextureRange('zombie', 'png', 0 + 144, 3 + 144),
            "walk_right": getTextureRange('zombie', 'png', 4 + 144, 11 + 144),
            "slam_right": getTextureRange('zombie', 'png', 12 + 144, 15 + 144),
            "bite_right": getTextureRange('zombie', 'png', 16 + 144, 19 + 144),
            "block_right": getTextureRange('zombie', 'png', 20 + 144, 21 + 144),
            "die_right": getTextureRange('zombie', 'png', 22 + 144, 27 + 144),
            "die_crit_right": getTextureRange('zombie', 'png', 28 + 144, 35 + 144),
            "stance_down_right": getTextureRange('zombie', 'png', 0 + 180, 3 + 180),
            "walk_down_right": getTextureRange('zombie', 'png', 4 + 180, 11 + 180),
            "slam_down_right": getTextureRange('zombie', 'png', 12 + 180, 15 + 180),
            "bite_down_right": getTextureRange('zombie', 'png', 16 + 180, 19 + 180),
            "block_down_right": getTextureRange('zombie', 'png', 20 + 180, 21 + 180),
            "die_down_right": getTextureRange('zombie', 'png', 22 + 180, 27 + 180),
            "die_crit_down_right": getTextureRange('zombie', 'png', 28 + 180, 35 + 180),
            "stance_down": getTextureRange('zombie', 'png', 0 + 216, 3 + 216),
            "walk_down": getTextureRange('zombie', 'png', 4 + 216, 11 + 216),
            "slam_down": getTextureRange('zombie', 'png', 12 + 216, 15 + 216),
            "bite_down": getTextureRange('zombie', 'png', 16 + 216, 19 + 216),
            "block_down": getTextureRange('zombie', 'png', 20 + 216, 21 + 216),
            "die_down": getTextureRange('zombie', 'png', 22 + 216, 27 + 216),
            "die_crit_down": getTextureRange('zombie', 'png', 28 + 216, 35 + 216),
            "stance_down_left": getTextureRange('zombie', 'png', 0 + 252, 3 + 252),
            "walk_down_left": getTextureRange('zombie', 'png', 4 + 252, 11 + 252),
            "slam_down_left": getTextureRange('zombie', 'png', 12 + 252, 15 + 252),
            "bite_down_left": getTextureRange('zombie', 'png', 16 + 252, 19 + 252),
            "block_down_left": getTextureRange('zombie', 'png', 20 + 252, 21 + 252),
            "die_down_left": getTextureRange('zombie', 'png', 22 + 252, 27 + 252),
            "die_crit_down_left": getTextureRange('zombie', 'png', 28 + 252, 35 + 252)
        });
        sprite.play("walk_left");
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.65;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 1;
        sprite.scale.y = 1;
        sprite.layer = 2;
        sprite.animationSpeed = 0.1;
        sprite.renderLogic = zombieRenderLogic.bind(null, sprite);
        return [sprite];
    });

    function zombieRenderLogic(sprite, entity) {
        var placement = entity.components.placement;
        var movable = entity.components.movable;
        var action = "walk";
        var direction = "left";
        if (movable) {
            if (movable.velocity.norm() === 0) {
                action = "stance";
            } else {
                action = "walk";
            }
        }
        if (placement) {
            direction = orientationToDirection(placement.orientation);
        }

        sprite.clip = action + "_" + direction;
        sprite.rotation = 0;
    }

    function orientationToDirection(o) {
        var direction;
        var orientation = o % (Math.PI * 2);
        orientation = o < (Math.PI / 4) ? o + (Math.PI * 2) : o;
        orientation = Math.floor((orientation - (Math.PI / 4)) / (Math.PI / 4));
        switch (orientation) {
            default:
            case 0: direction = "right"; break;
            case 1: direction = "up_right"; break;
            case 2: direction = "up"; break;
            case 3: direction = "up_left"; break;
            case 4: direction = "left"; break;
            case 5: direction = "down_left"; break;
            case 6: direction = "down"; break;
            case 7: direction = "down_right"; break;
        }
        return direction;
    }

    function getTextureRange(name, ext, start, end) {
        var textures = [];
        for (var i = start; i <= end; i++) {
            textures.push(pixi.Texture.fromFrame(name + i + "." + ext));
        }
        return textures;
    }

    function spriteFromGenericHex(path) {
        var sprite = new pixi.Sprite(pixi.Texture.fromImage(path));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = 0;
        sprite.position.y = 0;
        sprite.scale.x = 0.54;
        sprite.scale.y = 0.54;
        return sprite;
    }
}

module.exports = {
    register: register
};
