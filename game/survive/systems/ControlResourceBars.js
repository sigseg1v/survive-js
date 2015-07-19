"use strict";
var limit = require('../../etc/ratelimiter.js');

function ControlResourceBars(container, Placement, ResourceBars, Chargeable, Healable, Resource, world, game, effects) {

    var pulseTimeoutHandles = {};
    game.events.on('addEntity', function (entity) {
        if (entity.components.resourceBars) {
            initBars(entity);
        }
        pulseTimeoutHandles[entity.id] = null;
    });

    game.events.on('removeEntity', function (entity) {
        if (pulseTimeoutHandles.hasOwnProperty(entity.id)) {
            if (pulseTimeoutHandles[entity.id] !== null) {
                clearTimeout(pulseTimeoutHandles[entity.id]);
            }
            delete pulseTimeoutHandles[entity.id];
        }
    });

    game.events.on('resourcePulse', function (entity) {
        pulseBars(entity);
    });

    this.step = function step(time) {
        ResourceBars.forWith([Placement.name], function (entity) {
            // TODO -- update only when data is changed?
            limit.byCooldown(entity.components.resourceBars, updateBars.bind(null, entity));
        });
    };

    function updateBars(entity) {
        var barCompData = entity.components.resourceBars;
        barCompData.updateBars(entity.components.placement.position);
    }

    function pulseBars(entity, duration) {
        duration = duration || 2000;
        var barCompData = entity.components.resourceBars;
        if (barCompData) {
            barCompData.bars.forEach(function (bar) {
                bar.setVisible(true);
            });

            if (pulseTimeoutHandles.hasOwnProperty(entity.id)) {
                if (pulseTimeoutHandles[entity.id] !== null) {
                    clearTimeout(pulseTimeoutHandles[entity.id]);
                }
            }
            pulseTimeoutHandles[entity.id] = setTimeout(function () {
                barCompData.bars.forEach(function (bar) {
                    bar.setVisible(false);
                });
                pulseTimeoutHandles[entity.id] = null;
            }, duration);
        }
    }

    function initBars(entity) {
        var barCompData = entity.components.resourceBars;

        var healableComp = entity.components.healable;
        if (healableComp) {
            barCompData.addBar(healableComp, 'currentHealth', 'maximumHealth', 0xFF5555);
        }

        var chargeableComp = entity.components.chargeable;
        if (chargeableComp) {
            barCompData.addBar(chargeableComp, 'currentEnergy', 'maximumEnergy', 0x5555FF);
        }

        var resourceComp = entity.components.resource;
        if (resourceComp) {
            resourceComp._firstObservedMax = resourceComp.amount;
            barCompData.addBar(resourceComp, 'amount', '_firstObservedMax', 0xFF5555);
        }

        barCompData.bars.forEach(function (bar) {
            bar.setVisible(false);
        });
    }
}

module.exports = ControlResourceBars;
module.exports.$inject = ['$container', 'component/Placement', 'component/ResourceBars', 'component/Chargeable', 'component/Healable', 'component/Resource', 'World', 'Game', 'system/Effects'];
