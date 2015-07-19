"use strict";

// TODO -- probably don't even need or want this file at all,
//         it depends on whether we want to handle the event data individually in the
//         system implementations (not sure if we want to use socket.on in those, however)
function ClientMessageHandler(socket, effects, world, game, DayNightCycle) {
    var self = this;
    self.registerHandlers = function registerHandlers() {
        socket.on('entityCharged', handleEntityCharged);
        socket.on('entityHealed', handleEntityHealed);
        socket.on('entityProjectile', handleEntityProjectile);
        socket.on('entityMelee', handleEntityMelee);
        socket.on('dayNightCycle', handleDayNightCycle);
        socket.on('chat-message', handleChatMessage);
        socket.on('resourceGathered', handleResourceGathered);
        socket.on('rockAttacked', handleRockAttacked);
    };

    function handleEntityCharged(data) {
        effects.drawChargeLaser(data.source, data.destination);

        var destinationEntity = world.entityById(data.destinationId);
        if (destinationEntity) {
            game.events.emit('resourcePulse', destinationEntity);
        }
    }
    function handleEntityHealed(data) {
        effects.drawHealLaser(data.source, data.destination);

        var destinationEntity = world.entityById(data.destinationId);
        var sourceEntity = world.entityById(data.sourceId);
        if (destinationEntity && sourceEntity) {
            game.events.emit('resourcePulse', destinationEntity);
            game.events.emit('resourcePulse', sourceEntity);
        }
    }
    function handleEntityProjectile(data) {
        var sourceEntity = world.entityById(data.sourceEntityId);
        var targetEntity = world.entityById(data.targetEntityId);
        if (sourceEntity && targetEntity) {
            effects.drawAttackProjectile(sourceEntity, targetEntity);
            game.events.emit('resourcePulse', sourceEntity);
            game.events.emit('resourcePulse', targetEntity);
        }
    }

    function handleRockAttacked(data) {
        var targetEntity = world.entityById(data.targetEntityId);
        if (targetEntity) {
            game.events.emit('resourcePulse', targetEntity);
        }
    }

    var resourceEffectStyles = {
        def: { font: '12px Michroma', fill: 'white' },
        '0': { font: '12px Michroma', fill: 'white' },   // rock
        '1': { font: '12px Michroma', fill: '#FD4554' }, // red
        '2': { font: '12px Michroma', fill: '#0E91C9' }, // blue
        '3': { font: '12px Michroma', fill: '#4AD34E' }, // green
        '4': { font: '12px Michroma', fill: '#AC40E3' }  // purple
    };
    function resourceDataToCombatTextString(data) {
        return ((data.amount < 0) ? '-' : '+') + '<' + data.type + '>' + (Math.floor(((data.amount < 0) ? data.amount * -10 : data.amount * 10)) / 10) + '</' + data.type + '>';
    }
    function handleResourceGathered(data) {
        var resourceChangeStrings = data.resources.map(function (data) {
            return resourceDataToCombatTextString(data);
        });
        data.resources.forEach(function (data) {
            var sourceEntity = world.entityById(data.sourceEntityId);
            if (sourceEntity) {
                game.events.emit('resourcePulse', sourceEntity);
            }
        });
        var targetEntity = world.entityById(data.targetEntityId);
        if (targetEntity && resourceChangeStrings.length > 0) {
            effects.drawCombatText(targetEntity, resourceChangeStrings.join('  '), resourceEffectStyles);
        }
    }

    function handleEntityMelee(data) {
        //var sourceEntity = world.entityById(data.sourceEntityId);
        var targetEntity = world.entityById(data.targetEntityId);
        if (targetEntity) {
            game.events.emit('resourcePulse', targetEntity);
        }
    }
    function handleDayNightCycle(data) {
        DayNightCycle.update(data);
    }
    function handleChatMessage(data) {
        game.events.emit('chat-receive', data);
    }
}

module.exports = ClientMessageHandler;
module.exports.$inject = ['socket', 'system/Effects', 'World', 'Game', 'system/DayNightCycle'];
