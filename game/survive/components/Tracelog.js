"use strict";
var Component = require('../../engine/Component.js');

function TracelogComponent() {
    Component.call(this);
    this.name = "tracelog";
    this.allocator = TracelogData.bind({}, this);
}
TracelogComponent.prototype = Object.create(Component.prototype);
TracelogComponent.prototype.constructor = TracelogComponent;
TracelogComponent.$inject = [];

function TracelogData(comp, entity, options) {
    this.injector = 'component/Tracelog';
    this.component = comp;
    this.options = options || {};
    this.messageQueue = [];
    this.persistent = {};
}
TracelogData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        messageQueue: [],
        persistent: {}
    };
};

module.exports = TracelogComponent;
