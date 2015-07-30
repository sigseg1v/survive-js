"use strict";
var limit = require('game/etc/ratelimiter');

function DeployLighttrails(game, socket, Lighttrail) {
    var self = this;

    self.step = function step() {
        var i, l, entity, comp;
        for (i = 0, l = Lighttrail.entities.length; i < l; ++i) {
            entity = Lighttrail.entities[i];
            comp = entity.components.lighttrail;

            limit.byCooldown(comp, createLightTrailNode, [comp, entity.components.placement.position]);
        }
    };

    function createLightTrailNode(comp, pos) {
        socket.emit('lighttrail-create', {
            pos: pos,
            scale: comp.scale,
            intensity: comp.intensity,
            duration: comp.duration
        });
    }
}

module.exports = DeployLighttrails;
module.exports.$inject = [ 'Game', 'socket', 'component/Lighttrail' ];
