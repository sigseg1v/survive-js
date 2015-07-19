"use strict";
var Component = require('../../engine/Component.js');

function UseComponent() {
    Component.call(this);
    this.name = "use";
    this.allocator = UseData.bind({}, this);
}
UseComponent.prototype = Object.create(Component.prototype);
UseComponent.prototype.constructor = UseComponent;
UseComponent.$inject = [];

function UseData(comp, options) {
    this.injector = 'component/Use';
    this.component = comp;
    this.options = options || {};

    this.cooldown = 1000;
}
UseData.prototype.toJSON = function toJSON() {
    return null;
};

module.exports = UseComponent;
