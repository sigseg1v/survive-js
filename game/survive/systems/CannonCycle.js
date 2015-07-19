"use strict";
var limit = require('../../etc/ratelimiter.js');
var shuffle = require('shuffle-array');

function CannonCycle(container, socket, Cannon, Chargeable, world, effects) {
    this.step = function step(time) {
        var potentialTargets = world.physics.find({
            labels: { $in: ['enemy'] }
        });

        Cannon.forWith([], function (entity) {
            limit.byCooldown(entity.components.cannon, shoot.bind(null, entity, potentialTargets));
        });
    };

    function shoot(entity, potentialTargets) {
        if (potentialTargets.length === 0) {
            return;
        }

        var i, len, minDist, dist, nearest;
        var chargeable = entity.components.chargeable;
        var position = entity.components.placement.position;
        var cannon = entity.components.cannon;
        var range = cannon.range;

        if (chargeable.currentEnergy < cannon.attackCost) {
            return;
        }

        var target = (cannon.currentTarget && (cannon.currentTarget.components.placement.position.dist(position) <= range)) ? cannon.currentTarget : null;
        if (!target) {
            potentialTargets = potentialTargets.filter(function (potential) {
                return potential.entity().components.placement.position.dist(position) <= range;
            });
            shuffle(potentialTargets); // TODO -- this is potentially slow, we could find random targets in a faster way
            minDist = Infinity;
            for (i = 0, len = potentialTargets.length; i < len; i++) {
                dist = position.dist(potentialTargets[i].state.pos);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = potentialTargets[i];
                }
            }
            target = nearest ? nearest.entity() : null;
        }
        if (target) {
            var amount = cannon.attackPower;
            var targetHealable = target.components.healable;
            var scaledDamage = targetHealable.currentHealth < amount ? targetHealable.currentHealth : amount;
            targetHealable.currentHealth = targetHealable.currentHealth - amount;
            chargeable.currentEnergy = chargeable.currentEnergy - cannon.attackCost;

            socket.emit('entityProjectile', {
                sourceEntityId: entity.id,
                targetEntityId: target.id,
                damage: scaledDamage
            });

            if (targetHealable.currentHealth <= 0) {
                cannon.currentTarget = null;
                world.removeEntity(target);
            } else {
                cannon.currentTarget = target;
            }
        }
    }
}

module.exports = CannonCycle;
module.exports.$inject = ['$container', 'socket', 'component/Cannon', 'component/Chargeable', 'World', 'system/Effects'];
