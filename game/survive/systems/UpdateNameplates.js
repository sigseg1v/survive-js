"use strict";
var limit = require('../../etc/ratelimiter.js');

function UpdateNameplates(Placement, Name) {
    this.step = function step(time) {
        Name.forWith([Placement.name], function (entity) {
            update(entity);
        });
    };

    function update(entity) {
        var comp = entity.components.name;
        if (comp.graphics) {
            comp.graphics.setTextPosition(entity.components.placement.position);
        }
    }
}

module.exports = UpdateNameplates;
module.exports.$inject = ['component/Placement', 'component/Name'];
