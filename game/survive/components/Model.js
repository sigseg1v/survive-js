"use strict";
var isServer = typeof window === 'undefined';
var Component = require('game/engine/Component');

var sprites = {};

function ModelComponent() {
    Component.call(this);

    this.name = "model";
    this.allocator = ModelData.bind({}, this);

    this.registerSpriteLoader = function registerSpriteLoader(name, func) {
        sprites[name] = func;
    };
}
ModelComponent.prototype = Object.create(Component.prototype);
ModelComponent.prototype.constructor = ModelComponent;
ModelComponent.$inject = [];

function ModelData(comp, entity, options) {
    options = options || {};
    this.sprites = options.hasOwnProperty('name') ? loadModel(options.name) : [];
    this.modelName = options.name;
}
ModelData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        modelName: this.modelName
    };
};

function loadModel(options) {
    if (!isServer) {
        var name = options;

        if (sprites[name]) {
            return sprites[name].call(options);
        } else {
            console.log("Unable to load model for " + name);
        }
    }
    return null;
}

ModelComponent.prototype.createSprites = loadModel;
ModelComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    if (initialize) {
        this.sprites = loadModel(serialized.modelName);
        this.modelName = serialized.modelName;
    }
};

module.exports = ModelComponent;
