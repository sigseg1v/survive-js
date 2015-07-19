"use strict";

// TODO -- probably don't even need or want this file at all,
//         it depends on whether we want to handle the event data individually in the
//         system implementations (not sure if we want to use socket.on in those, however)
function ClientMessageHandler(socket, effects, world, game) {
    var self = this;

    self.registerHandlers = function registerHandlers() {
        socket.on('chat-message', handleChatMessage);
    };

    function handleChatMessage(data) {
        game.events.emit('chat-receive', data);
    }
}

module.exports = ClientMessageHandler;
module.exports.$inject = ['socket', 'system/Effects', 'World', 'Game'];
