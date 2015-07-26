"use strict";
var physics = require('assets/bower_components/physicsjs/dist/physicsjs-full');

function Hex(q, r, scale) {
    this.q = q || 0;
    this.r = r || 0;
    this.scale = scale || 1;
}

var neighbourDeltas = [
    [ 1,  0],
    [ 1, -1],
    [ 0, -1],
    [-1,  0],
    [-1,  1],
    [ 0,  1]
];

Hex.prototype.equals = function equals(other) {
    return this.q === other.q && this.r === other.r;
};

Hex.prototype.clone = function clone(from) {
    if (from) {
        this.q = from.q;
        this.r = from.r;
        return this;
    }
    return new Hex(this.q, this.r);
};

Hex.prototype.set = function set(q, r) {
    this.q = q;
    this.r = r;
    return this;
};

Hex.prototype.getHashCode = function getHashCode() {
    // largest supported q and r: +/- 0x7FFF
    //return ((this.q + 0x8000) << 16) | ((this.r + 0x8000) & 0xFFFF);
    return "q" + this.q + "r" + this.r;
};

Hex.prototype.contains = function contains(point) {
    return cartesianToHex(point.x, point.y, this.scale).equals(this);
};

Hex.prototype.getNeighbourPositions = function getNeighbourPositions() {
    var i, len, out;
    out = [];
    for (i = 0, len = neighbourDeltas.length; i < len; i++) {
        out.push([this.q + neighbourDeltas[i][0], this.r + neighbourDeltas[i][1]]);
    }
    return out;
};

Hex.prototype.getX = function getX() {
    return this.scale * 1.7320508075 * (this.q + this.r / 2.0);
};

Hex.prototype.getY = function getY() {
    return this.scale * 1.5 * this.r;
};

Hex.prototype.toCubeCoordinates = function toCubeCoordinates() {
    return [this.q, -this.q - this.r, this.r];
};

Hex.prototype.getCenter = function getCenter() {
    return new physics.vector(this.getX(), this.getY());
};

Hex.prototype.setCenter = function setCenter(center) {
    var cubeCoords = getCubeCoordinates(center.x, center.y);
    this.q = cubeCoords[0];
    this.r = cubeCoords[2];
};

Hex.prototype.setValuesByCartesian = function setValuesByCartesian(x, y, scale) {
    var cubeCoords = getCubeCoordinates(x, y, scale);
    this.q = cubeCoords[0];
    this.r = cubeCoords[2];
    this.scale = scale;
    return this;
};

Hex.fromCartesian = cartesianToHex;

function cartesianToHex(x, y, scale) {
    var cubeCoords = getCubeCoordinates(x, y, scale);
    return new Hex(cubeCoords[0], cubeCoords[2]);
}

function getCubeCoordinates(x, y, scale) {
    scale = scale || 1;
    var _q = 1 / 3.0 * 1.7320508075 * x / scale - 1 / 3.0 * y / scale;
    var _r = 2 / 3.0 * y / scale;
    var _y = -_q - _r;

    var rx = Math.round(_q);
    var ry = Math.round(_y);
    var rz = Math.round(_r);

    var x_err = Math.abs(rx - _q);
    var y_err = Math.abs(ry - _y);
    var z_err = Math.abs(rz - _r);

    if (x_err > y_err && x_err > z_err) {
        rx = -ry - rz;
    } else if (y_err > z_err) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }

    return [rx, ry, rz];
}

module.exports = Hex;
