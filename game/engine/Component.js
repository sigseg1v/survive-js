"use strict";
var Entity = require('./Entity.js');

function Component() {
    this.name = null;
    this.allocator = null;
    this.entities = [];
    this.changed = {};
}

Component.prototype = {
    // registers and entity and returns allocated data representing this component
    // does not attach this to the entities list of components
    registerEntity: function registerEntity(entity, options) {
        this.entities.push(entity);
        return new this.allocator(entity, options);
    },
    unregisterEntity: function unregisterEntity(entity) {
        var index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    },
    forWith: function forWith(comps, func) {
        for (var i = 0; i < this.entities.length; i++) {
            if (Entity.prototype.supports.apply(this.entities[i], comps)) {
                if (func.call(this.entities[i], this.entities[i]) === 'break') {
                    break;
                }
            }
        }
    },
    entityDataChanged: function entityDataChanged(entity) {
        this.changed[entity.id] = entity;
    },
    getAndClearChangeData: function getAndClearChangeData() {
        var data = Object.keys(this.changed).map(function (id) {
            return {
                id: id,
                data: this.changed[id].components[this.name]
            };
        }, this);
        this.changed = {};
        return data;
    }
};

module.exports = Component;
