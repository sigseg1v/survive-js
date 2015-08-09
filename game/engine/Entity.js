"use strict";
var container = require('game/inversion/container');

function Entity() {
    this.id = Entity.prototype.idPrefix === '' ?
        Entity.prototype.nextId :
        (Entity.prototype.idPrefix + '$' + Entity.prototype.nextId);
    Entity.prototype.nextId++;
    this.components = {};
    this._labels = [];
    Object.defineProperty(this, 'labels', {
        get: function () { return this._labels; },
        set: function (val) {
            while (this._labels.length > 0) {
                this._labels.pop();
            }
            this._labels.push.apply(this.labels, val);
        }
    });
}

Entity.prototype = {
    nextId: 0,
    idPrefix: '',
    addComponent: function addComponent(component, options) {
        this.components[component.name] = component.registerEntity(this, options ? options[component.name] : null);
        this.validateComponents();
        this.finishComposition();
    },
    addComponents: function addComponents(components, options, skipComposition) {
        var component;
        for (var i = 0, len = components.length; i < len; i++) {
            component = components[i];
            this.components[component.name] = component.registerEntity(this, options ? options[component.name] : null);
        }
        this.validateComponents();
        if (!skipComposition) {
            this.finishComposition();
        }
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
    // calls finishComposition functions with signature (entity)
    finishComposition: function finishComposition() {
        var componentData, i, j, ilen, jlen;
        var componentKeys = Object.keys(this.components);
        for (i = 0, ilen = componentKeys.length; i < ilen; i++) {
            componentData = this.components[componentKeys[i]];
            if (componentData && !componentData.__composed) {
                if (componentData.finishComposition) {
                    componentData.finishComposition(this);
                }
                componentData.__composed = true;
            }
        }
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
        var added = [];
        Object.keys(serialized.components).forEach(function (componentKey) {
            var compData = serialized.components[componentKey];
            if (compData) { // non-sync components will not have data
                var comp = container.resolve(compData.injector);
                added.push({
                    component: comp,
                    data: compData
                });
            }
        });
        ent.addComponents(added.map(function (add) { return add.component; }), /* options: */ null, /* skipComposition: */ true);
        added.forEach(function (add) {
            var comp = add.component;
            var compData = add.data;
            if (comp.reconstruct) {
                // reconstruct is on the component prototype instead of componentdata, otherwise it's too annoying to find from serialized data
                comp.reconstruct.call(ent.components[comp.name], compData, /* initialize */ true);
            }
        });
        ent.labels = serialized.labels;
        ent.finishComposition();
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
            components: this.components,
            labels: this.labels
        };
    }
};

module.exports = Entity;
