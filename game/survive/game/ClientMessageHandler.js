"use strict";

// TODO -- probably don't even need or want this file at all,
//         it depends on whether we want to handle the event data individually in the
//         system implementations (not sure if we want to use socket.on in those, however)
function ClientMessageHandler(socket, effects, world, game) {
    var self = this;

    self.registerHandlers = function registerHandlers() {
        socket.on('chat-message', handleChatMessage);
        socket.on('entity-damaged', handleEntityDamaged);
        socket.on('entity-attack', handleEntityAttack);
        socket.on('path-update', function (path) {
            path.forEach(function (node, i) {
                setTimeout(effects.drawLocationDebugSprite.bind(null, node), i * 20);
            });
        });
    };

    function handleChatMessage(data) {
        game.events.emit('chat-receive', data);
    }

    function handleEntityDamaged(data) {
        var ent = world.entityById(data.entityId);
        if (!ent) return;
        game.events.emit('entity-damaged', data);
        effects.drawCombatText(ent, "-<num>" + data.amount + "</num>",
            {
                def: { font: '12px Michroma', fill: 'white' },
                num: { font: '12px Michroma', fill: '#FD4554' }
            });
    }

    function handleEntityAttack(data) {
        var ent = world.entityById(data.entityId);
        if (!ent) return;
        game.events.emit('entity-attack', data);
        effects.drawSpellEffect(ent, data.targetPoint, 0);
    }
}

module.exports = ClientMessageHandler;
module.exports.$inject = ['socket', 'system/Effects', 'World', 'Game'];
