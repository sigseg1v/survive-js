"use strict";
var container = require('../../wires.js');
var Block = container.resolve('Block');

var glyphs = {
    VOID: '.',
    ENDROW: '$',
    FLOOR: 'X',
    GEN_WALL: '#'
};

function parseLevelString(value) {
    var walls = [];
    var floors = [];
    var minerals = [];
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

    data.split('').forEach(function (node) {
        if (node === glyphs.GEN_WALL) {
            walls.push(new Block(x, y));
        } else if (node === glyphs.ENDROW) {
            y++;
            x = xStart;
            return;
        }

        // everything that isn't empty gets floorspace within the world
        if (node !== glyphs.VOID && node !== glyphs.ENDROW) {
            floors.push(new Block(x, y));
        }

        x++;
    });

    return {
        walls: walls,
        floors: floors
    };
}

function roundAwayFromZero(num) {
    return num <= 0 ? Math.floor(num) : Math.ceil(num);
}

var data = function(){/*!
##########$
#XXXXXXXX#$
#XXXXXXXX#$
#XXXXXXXX#$
#XXXXXXXX#$
##########$
*/};

module.exports = {
    data: data.toString().replace(/^[^\/]+\/\*!?/, '').replace(/\*\/[^\/]+$/, ''),
    parse: parseLevelString
};
