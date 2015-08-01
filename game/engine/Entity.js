"use strict";
var container = require('game/inversion/container');

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
        this.components[component.name] = component.registerEntity(this, options ? options[component.name] : null);
        this.validateComponents();
    },
    addComponents: function addComponents(components, options) {
        var component;
        for (var i = 0, len = components.length; i < len; i++) {
            component = components[i];
            this.components[component.name] = component.registerEntity(this, options ? options[component.name] : null);
        }
        this.validateComponents();
    },
    validateComponents: function validateComponents() {
        var componentData, i, j, ilen, jlen;
        var componentKeys = Object.keys(this.components);
        for (i = 0, ilen = componentKeys.length; i < ilen; i++) {
            componentData = this.components[componentKeys[i]];
            for (j = 0, jlen = componentData.component.dependencies.length; j < jlen; j++) {
                if (!this.components[componentData.component.dependencies[j]]) {
                    throw "component " + componentData.component.name + " depends on " + componentData.component.dependencies[j] + " but it was not found registered on this entity.";
                }
            }
        }
        return true;
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
