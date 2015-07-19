"use strict";
var container = require('../inversion/container.js');

function Entity() {
    this.id = Entity.prototype.idPrefix === '' ?
        Entity.prototype.nextId :
        (Entity.prototype.idPrefix + '$' + Entity.prototype.nextId);
    Entity.prototype.nextId++;
    this.components = {};
}

Entity.prototype = {
    nextId: 0,
    idPrefix: '',
    addComponent: function addComponent(component, options) {
        this.components[component.name] = component.registerEntity(this, options);
    },
    // check if a component is supported by names as parameters
    supports: function supports() {
        for (var i = 0; i < arguments.length; i++) {
            if (this.components.hasOwnProperty(arguments[i]) === false) {
                return false;
            }
        }
        return true;
    },
    reconstruct: function reconstruct(serialized) {
        var ent = new Entity();
        ent.id = serialized.id;
        Object.keys(serialized.components).forEach(function (componentKey) {
            var compData = serialized.components[componentKey];
            if (compData) { // non-sync components will not have data
                var comp = container.resolve(compData.injector);
                ent.addComponent(comp, compData.options);
                if (comp.reconstruct) {
                    // reconstruct is on the component prototype instead of componentdata, otherwise it's too annoying to find from serialized data
                    comp.reconstruct.call(ent.components[componentKey], compData, /* initialize */ true);
                }
            }
        });
        return ent;
    },
    deconstruct: function deconstruct() {
        Object.keys(this.components).forEach(function (key){
            if (this.components[key].deconstruct) {
                this.components[key].deconstruct.call(this.components[key]);
            }
            this.components[key].component.unregisterEntity(this);
        }, this);
    },
    setPrototypeIdPrefix: function setPrototypeIdPrefix(val) {
        if (val) {
            Entity.prototype.idPrefix = val;
        }
    },
    toJSON: function toJSON() {
        return {
            id: this.id,
            components: this.components
        };
    }
};

module.exports = Entity;
