"use strict";
var limit = require('../../etc/ratelimiter.js');

function GeneratorCycle(container, socket, Placement, Generator, Chargeable, world, effects) {
    this.step = function step(time) {
        var potentialTargets = world.physics.find({
            labels: { $in: ['chargeable'] }
        });

        Generator.forWith([], function (entity) {
            limit.byCooldown(entity.components.generator, charge.bind(null, entity, potentialTargets));
        });
    };

    function charge(entity, potentialTargets) {
        var range = entity.components.generator.range;
        var position = entity.components.placement.position;
        var targets = potentialTargets.filter(function (body) {
            return position.dist(body.state.pos) <= range;
        });
        var amount = entity.components.generator.chargeAmount / targets.length;
        targets.forEach(function (target) {
            var chargeable = target.entity().components.chargeable;
            if (chargeable.currentEnergy == chargeable.maximumEnergy) {
                return;
            }
            var afterCharge = chargeable.currentEnergy + amount;
            if (afterCharge > chargeable.maximumEnergy) {
                chargeable.currentEnergy = chargeable.maximumEnergy;
            } else {
                chargeable.currentEnergy = afterCharge;
            }
            socket.emit('entityCharged', {
                source: position,
                sourceId: entity.id,
                destination: target.state.pos,
                destinationId: target.entity().id
            });
        });
    }
}

module.exports = GeneratorCycle;
module.exports.$inject = ['$container', 'socket', 'component/Placement', 'component/Generator', 'component/Chargeable', 'World', 'system/Effects'];
