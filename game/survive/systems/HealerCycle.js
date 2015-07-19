"use strict";
var limit = require('../../etc/ratelimiter.js');

function HealerCycle(container, socket, Placement, Healer, Healable, world, effects) {
    this.step = function step(time) {
        var potentialTargets = world.physics.find({
            labels: { $in: ['healable'], $nin: ['enemy'] }
        });

        Healer.forWith([], function (entity) {
            limit.byCooldown(entity.components.healer, heal.bind(null, entity, potentialTargets));
        });
    };

    function heal(entity, potentialTargets) {
        var chargeable = entity.components.chargeable;
        var range = entity.components.healer.range;
        var efficiency = entity.components.healer.efficiency;
        var amount = entity.components.healer.healCost;
        var position = entity.components.placement.position;
        var targets = potentialTargets.filter(function (body) {
            return position.dist(body.state.pos) <= range;
        });
        var target, i, len;
        for(i = 0, len = targets.length; i < len; i++) {
            var healable = targets[i].entity().components.healable;
            if (chargeable.currentEnergy < amount) {
                break;
            }
            if (healable.currentHealth == healable.maximumHealth) {
                continue;
            }
            var drain = amount;
            var afterHeal = healable.currentHealth + drain * efficiency;
            if (afterHeal > healable.maximumHealth) {
                healable.currentHealth = healable.maximumHealth;
            } else {
                healable.currentHealth = afterHeal;
            }
            chargeable.currentEnergy = chargeable.currentEnergy - drain;
            socket.emit('entityHealed', {
                source: position,
                sourceId: entity.id,
                destination: targets[i].state.pos,
                destinationId: targets[i].entity().id
            });
        }
    }
}

module.exports = HealerCycle;
module.exports.$inject = ['$container', 'socket', 'component/Placement', 'component/Healer', 'component/Healable', 'World', 'system/Effects'];
