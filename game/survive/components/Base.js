"use strict";
var Component = require('../../engine/Component.js');

function BaseComponent() {
    Component.call(this);
    this.name = "base";
    this.allocator = BaseData.bind({}, this);
}
BaseComponent.prototype = Object.create(Component.prototype);
BaseComponent.prototype.constructor = BaseComponent;
BaseComponent.$inject = [];

function BaseData(comp, options) {
    this.injector = 'component/Base';
    this.component = comp;
    this.options = options || {};
}
BaseData.prototype.toJSON = function toJSON() {
    return null;
};

module.exports = BaseComponent;
