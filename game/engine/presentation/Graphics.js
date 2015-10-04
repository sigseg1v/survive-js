"use strict";

/*
 *  Wrapper for graphics that exist in the game world space (not UI graphics).
 */
function Graphics(pixi, renderer) {
    var self = this;
    self.renderer = renderer;
    self.data = new pixi.Graphics();
    self.offset = { x: 0, y: 0 };
    self.textData = null;
    self.__pixi = pixi;
}
Graphics.$inject = ['lib/pixi.js', 'system/Renderer'];
Graphics.prototype.setPosition = function setPosition(x, y) {
    var gfxData = this.data;
    gfxData.position.x = (this.offset.x + x) * this.renderer.GFX_SCALE;
    gfxData.position.y = (this.offset.y * -1 + y) * this.renderer.GFX_SCALE * -1;
};
Graphics.prototype.invalidate = function invalidate() {
    this.data.dirty = true;
    this.data.clearDirty = true;
};
Graphics.prototype.drawRect = function drawRect(x, y, w, h) {
    var pos = { x: x, y: y };
    this.renderer.applyCoordinateTransform(pos);
    this.data.drawRect(
        pos.x + this.offset.x * this.renderer.GFX_SCALE,
        pos.y + (this.offset.y * this.renderer.GFX_SCALE * -1),
        w * this.renderer.GFX_SCALE,
        h * this.renderer.GFX_SCALE
    );
};
Graphics.prototype.setText = function setText(text, options) {
    if (!this.textData) {
        this.textData = new this.__pixi.Text(text, options);
    } else {
        this.textData.text = text;
        if (options) {
            this.textData.setStyle(options);
        }
    }
};
Graphics.prototype.setTextPosition = function setTextPosition(pos) {
    this.renderer.applyCoordinateTransform(this.textData, pos.x, pos.y);
    this.textData.x += (this.offset.x) * this.renderer.GFX_SCALE;
    this.textData.y += (this.offset.y * -1) * this.renderer.GFX_SCALE * -1;
};
Graphics.prototype.getTextWidth = function getTextWidth() {
    return this.textData.width / this.renderer.GFX_SCALE;
};

module.exports = Graphics;
