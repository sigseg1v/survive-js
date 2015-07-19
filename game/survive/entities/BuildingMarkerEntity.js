"use strict";
var Entity = require('../../engine/Entity.js');

function BuildingMarkerEntity(Placement, Model, Follow, options) {
    Entity.call(this);
    options = options || {};
    this.addComponent(Placement, options[Placement.name]);
    this.addComponent(Model, options[Model.name]);
    this.addComponent(Follow, options[Follow.name]);
}
BuildingMarkerEntity.prototype = Object.create(Entity.prototype);
BuildingMarkerEntity.prototype.constructor = BuildingMarkerEntity;

module.exports = BuildingMarkerEntity;
module.exports.$inject = ['component/Placement', 'component/Model', 'component/Follow'];
