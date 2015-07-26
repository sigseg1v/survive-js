"use strict";
var Component = require('game/engine/Component');
var isServer = typeof window === 'undefined';

function NameComponent(game, container) {
    Component.call(this);

    this.name = "name";
    this.allocator = NameData.bind({}, this, game, container);
}
NameComponent.prototype = Object.create(Component.prototype);
NameComponent.prototype.constructor = NameComponent;
NameComponent.$inject = ['Game', '$container'];

function NameData(comp, game, container, entity, options) {
    this.options = options || {};
    this.injector = 'component/Name';
    this.component = comp;
    this.game = game;

    this._name = this.options.name || '';
    Object.defineProperty(this, 'name', {
        get: function () { return this._name; },
        set: function (val) {
            if (val && (this._name != val)) {
                this._name = val;
                comp.entityDataChanged(entity);
            }
        }
    });

    this.graphics = null;
    if (!isServer) {
        initNameplate(this, container);
    }
}
NameData.prototype.toJSON = function toJSON() {
    return {
        injector: this.injector,
        options: this.options,
        name: this.name
    };
};
NameComponent.prototype.reconstruct = function reconstruct(serialized, initialize) {
    this._name = serialized.name;
    if (!isServer) {
        this.graphics.setText(serialized.name);
        this.graphics.offset.x = (this.graphics.getTextWidth() / 2) * -1;
    }
};
NameData.prototype.deconstruct = function deconstruct() {
    if (!isServer) {
        this.game.events.emit('removeGraphics', this.graphics.textData);
    }
};
function initNameplate(data, container) {
    var graphics = container.resolve('Graphics');
    graphics.setText(data.name, { font: '12px Michroma', fill: 'green' });
    graphics.offset.x = (graphics.getTextWidth() / 2) * -1;
    graphics.offset.y = -1.5;
    graphics.textData.layer = 8;
    data.game.events.emit('addGraphics', graphics.textData);
    data.graphics = graphics;
}

module.exports = NameComponent;
