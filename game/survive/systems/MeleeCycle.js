"use strict";
var limit = require('../../etc/ratelimiter.js');

function MeleeCycle(container, socket, Melee, world) {
    this.step = function step(time) {
        var potentialTargets = world.physics.find({
            labels: { $in: ['building'] }
        });

        Melee.forWith([], function (entity) {
            limit.byCooldown(entity.components.melee, attack.bind(null, entity, potentialTargets));
        });
    };

    function attack(entity, potentialTargets) {
        if (potentialTargets.length === 0) {
            return;
        }

        var i, len;
        var position = entity.components.placement.position;
        var melee = entity.components.melee;
        var range = 2;

        var target = (melee.currentTarget && (melee.currentTarget.components.placement.position.dist(position) <= range)) ? melee.currentTarget : null;
        if (!target) {
            for (i = 0, len = potentialTargets.length; i < len; i++) {
                if (potentialTargets[i].entity().components.placement.position.dist(position) <= range) {
                    target = potentialTargets[i].entity();
                    break;
                }
            }
        }
        if (target) {
            var amount = melee.damage;
            var targetHealable = target.components.healable;
            var scaledDamage = targetHealable.currentHealth < amount ? targetHealable.currentHealth : amount;
            targetHealable.currentHealth = targetHealable.currentHealth - amount;

            socket.emit('entityMelee', {
                sourceEntityId: entity.id,
                targetEntityId: target.id,
                damage: scaledDamage
            });

            if (targetHealable.currentHealth <= 0) {
                melee.currentTarget = null;
                world.removeEntity(target);
            } else {
                melee.currentTarget = target;
            }
        }
    }
}

module.exports = MeleeCycle;
module.exports.$inject = ['$container', 'socket', 'component/Melee', 'World'];
