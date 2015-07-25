"use strict";
var container = require('../../wires.js');
var Block = container.resolve('Block');

var glyphs = {
    VOID: '.',
    ENDROW: '$',
    FLOOR: 'X',
    GEN_WALL: '#',
    SPAWNER: '+'
};

function parseLevelString(value) {
    var walls = [];
    var floors = [];
    var other = [];
    var recognizedGlyphs = Object.keys(glyphs).reduce(function (out, glyph) {
        return out += glyphs[glyph];
    }, '');
    var data = value.replace(new RegExp('[^' + recognizedGlyphs + ']', 'gm'), '');
    var lines = data.split(glyphs.ENDROW);
    var height = lines.length;
    var width = Math.max.apply(Math, lines.map(function(line) { return line.length; }));

    var xStart = -roundAwayFromZero(width / 2);
    var yStart = -roundAwayFromZero(height / 2);
    var x = xStart;
    var y = yStart;

    function setPlacement(entity) {
        entity.components.placement.position.x = x;
        entity.components.placement.position.y = y;
    }

    data.split('').forEach(function (node) {
        // everything that isn't empty gets floorspace within the world
        if (node !== glyphs.VOID && node !== glyphs.ENDROW) {
            floors.push(new Block(x, y));
        }

        var placement = new Block(x, y);

        if (node === glyphs.GEN_WALL) {
            walls.push(placement);
        } else if (node === glyphs.SPAWNER) {
            other.push(function() {
                var ent = container.resolve('entity/SpawnerEntity/slime');
                ent.components.placement.position = placement.getCenter();
                return ent;
            });
        } else if (node === glyphs.ENDROW) {
            y++;
            x = xStart;
            return;
        }

        x++;
    });

    return {
        walls: walls,
        floors: floors,
        entities: other
    };
}

function roundAwayFromZero(num) {
    return num <= 0 ? Math.floor(num) : Math.ceil(num);
}

var data = function(){/*!
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #$
# X X X X X X X X X X X X X X X X X X X X X X # X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X #$
# X X X X X X X X X X X X X X X X X X X X X X # X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X + X #$
# X X X X X X X X X X X X X X X X X X X X X X # X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X #$
# X X X X X X X # # # # # # # # # # # # X X X X # X X X X X X X X X X X X X X X # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #$
# X + X X X X # # . . . . . . . . . . # X X X X X # X X X X X X X X X X X X X X # . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .$
# X X X X X X # . . . . . . . . . . . # X X X X X X X X X X X X X X X X X X X X # . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .$
# # # # # # # # . . . . . . . . . . . # # # # # # # # # # # # # # # # # # # # # # . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .$
*/};

module.exports = {
    data: data.toString().replace(/^[^\/]+\/\*!?/, '').replace(/\*\/[^\/]+$/, ''),
    parse: parseLevelString
};
