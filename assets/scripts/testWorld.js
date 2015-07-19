"use strict";
var container = require('../../wires.js');
var Hex = container.resolve('Hex');

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

    var qStart = -roundAwayFromZero(width / 2);
    var rStart = roundAwayFromZero(height / 2);
    var q = qStart;
    var r = rStart;

    data.split('').forEach(function (node) {
        if (node === glyphs.GEN_WALL) {
            walls.push(new Hex(oddRCoordsToAxialQ(q, r), r, 1));
        } else if (node === glyphs.ENDROW) {
            r--;
            q = qStart;
            return;
        }

        // everything that isn't empty gets floorspace within the world
        if (node !== glyphs.VOID && node !== glyphs.ENDROW) {
            floors.push(new Hex(oddRCoordsToAxialQ(q, r), r, 1));
        }

        q++;
    });

    return {
        walls: walls,
        floors: floors
    };
}

function roundAwayFromZero(num) {
    return num <= 0 ? Math.floor(num) : Math.ceil(num);
}

function oddRCoordsToAxialQ(q, r) {
    return Math.floor(q - (r - (r&1)) / 2);
}

function genCircle(radius) {
    var i, j;
    var wh = radius * 2;
    var out = [];
    var line;
    for (j = 0; j < wh; j++) {
        line = [];
        for (i = 0; i < wh; i++) {
            if (((i - radius) * (i - radius) + (j - radius) * (j - radius)) <= radius * radius) {
                line.push('*');
            } else {
                line.push('.');
            }
        }
        out.push(line);
    }
    return out;
}

function genWorld(radius) {
    return genCircle(radius).reduce(function (out, line, i) {
        if (i % 2 === 0) {
            out += ' ';
        }
        out += line.join(' ');
        if (i % 2 !== 0) {
            out += ' ';
        }
        out += '$\n';
        return out;
    }, '');
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
