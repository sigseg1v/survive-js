"use strict";
var Component = require('../../engine/Component.js');
var isServer = typeof window === 'undefined';

function ResourceBarsComponent(game, container) {
    Component.call(this);

    this.name = "resourceBars";
    this.allocator = ResourceBarsData.bind({}, this, game, container);
}
ResourceBarsComponent.prototype = Object.create(Component.prototype);
ResourceBarsComponent.prototype.constructor = ResourceBarsComponent;
ResourceBarsComponent.$inject = ['Game', '$container'];

function ResourceBarsData(comp, game, container, entity, options) {
    this.options = options || {};
    this.injector = 'component/ResourceBars';
    this.component = comp;
    this.game = game;
    this.bars = [];
    this.__container = container;
}
ResourceBarsData.prototype.cooldown = 500;
ResourceBarsData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options
    };
};
ResourceBarsData.prototype.addBar = function addBar(comp, valueProp, maxValueProp, color) {
    if (isServer) {
        return;
    }
    if (this.bars.some(function (barData) { return barData.compName == comp.component.name; })) {
        return;
    }

    var graphics = this.__container.resolve('Graphics');
    graphics.offset.x = 0.5 * -1;
    graphics.offset.y = (1 + this.bars.length * (1/10)) * -1;
    graphics.data.beginFill(0x000000);
    graphics.drawRect(0, 0, 1, 1 / 10);
    graphics.data.endFill();
    graphics.data.beginFill(color);
    graphics.drawRect(0, 0, (comp[valueProp] / comp[maxValueProp]), 1 / 10);
    graphics.data.endFill();
    graphics.data.zIndex = 50;
    var barData = {
        graphics: graphics,
        update: function (x, y) {
            graphics.setShapePosition(0, x, y);
            graphics.setShapePosition(1, x, y);
            graphics.data.graphicsData[1].shape.width = (comp[valueProp] / comp[maxValueProp]) * graphics.data.graphicsData[0].shape.width;
            graphics.invalidate();
        },
        setVisible: function (visible) {
            graphics.data.visible = !!visible;
        },
        compName: comp.component.name
    };
    this.bars.push(barData);
    this.game.events.emit('addGraphics', barData.graphics.data);
};
ResourceBarsData.prototype.updateBars = function updateBars(pos) {
    var bars, i, len;
    for (bars = this.bars, i = 0, len = this.bars.length; i < len; i++) {
        bars[i].update(pos.x, pos.y);
    }
};
ResourceBarsData.prototype.deconstruct = function deconstruct() {
    this.bars.forEach(function (barData) {
        this.game.events.emit('removeGraphics', barData.graphics.data);
    }, this);
};

module.exports = ResourceBarsComponent;
