"use strict";
var physics = require('../../../assets/bower_components/physicsjs/dist/physicsjs-full.js');

function Block(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

// x, y, dist * 10
var neighbourDeltas = [
    [-1, -1, 14],
    [-1,  0, 10],
    [-1,  1, 14],
    [ 0, -1, 10],
    [ 0,  1, 10],
    [ 1, -1, 14],
    [ 1,  0, 10],
    [ 1,  1, 14]
];

Block.prototype.equals = function equals(other) {
    return this.x === other.x && this.y === other.y;
};

Block.prototype.clone = function clone(from) {
    if (from) {
        this.x = from.x;
        this.y = from.y;
        return this;
    }
    return new Block(this.x, this.y);
};

Block.prototype.set = function set(x, y) {
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    return this;
};

Block.prototype.getHashCode = function getHashCode() {
    // largest supported x and y: +/- 0x7FFF
    //return ((this.x + 0x8000) << 16) | ((this.y + 0x8000) & 0xFFFF);
    return "x" + this.x + "y" + this.y;
};

Block.prototype.contains = function contains(point) {
    return Math.floor(point.x) === this.x && Math.floor(point.y) === this.y;
};

Block.prototype.getNeighbourPositions = function getNeighbourPositions() {
    var i, len, out;
    out = [];
    for (i = 0, len = neighbourDeltas.length; i < len; i++) {
        out.push([this.x + neighbourDeltas[i][0], this.y + neighbourDeltas[i][1], neighbourDeltas[i][2]]);
    }
    return out;
};

Block.prototype.getCenter = function getCenter() {
    return new physics.vector(this.x, this.y);
};

Block.prototype.setCenter = Block.prototype.set;

Block.fromPoint = pointToBlock;

function pointToBlock(x, y) {
    return new Block(Math.floor(x), Math.floor(y));
}

module.exports = Block;
