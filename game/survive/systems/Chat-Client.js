"use strict";
var $ = require('jquery-browserify');

function ChatClient(game, renderer, pixi, documentReady, ClientActions) {
    var self = this;

    var maxChatHeight = 400;
    var messages = [];

    var chatMessageStyle = { font: 'bold 12px Michroma', fill: 'black', stroke: 'white', strokeThickness: 1 };

    var chat = new pixi.Container();
    chat.x = 10;
    chat.y = renderer.renderer.height - 40;
    renderer.stage.addChild(chat);

    var messageBox = $("<input type='text' class='chat-input'>");
    messageBox.on('keyup keydown keypress', function (e) {
        if (e.keyCode !== 13 /* enter */ && e.keyCode !== 27 /* escape */) {
            e.stopPropagation();
        }
    });

    documentReady.then(function () {
        messageBox.css('display', 'none');
        messageBox.css('position', 'absolute');
        messageBox.css('top', (renderer.renderer.height - 36) + 'px');
        messageBox.css('left', '5px');
        messageBox.css('width', '320px');
        $('#view-inject').append(messageBox);
    });

    game.events.on('chat-receive', function (data) {
        var sprite = new pixi.Text('[' + data.user + ']: ' + data.message, chatMessageStyle);
        var messageObj = new Message(sprite);
        chat.addChild(messageObj.sprite);
        messages.push(messageObj);
        recalculateMessagePlacement();
    });

    game.events.on('open-chat-entry', function () {
        messageBox.css('display', 'block');
        messageBox.focus();
    });

    game.events.on('close-chat-entry', function () {
        messageBox.css('display', 'none');
    });

    game.events.on('send-chat-entry', function () {
        var message = messageBox.val().replace(/(\r\n|\n|\r)/gm, '').trim();
        if (message) {
            ClientActions.sendChatMessage(message);
        }
        messageBox.val('');
    });

    self.step = function (time) {
        var i, message;
        for (i = messages.length - 1; i >= 0; i--) {
            message = messages[i];
            if (!message.permanent) {
                message.time += time.elapsedSinceUpdate;
                if (message.time >= message.removeAt) {
                    chat.removeChild(message.sprite);
                    messages.splice(i, 1);
                    recalculateMessagePlacement();
                } else {
                    message.recalculateAlpha();
                }
            }
        }
    };

    function recalculateMessagePlacement() {
        var i, sprite;
        var heightCounter = 0;
        for (i = messages.length - 1; i >= 0; i--) {
            sprite = messages[i].sprite;
            if (heightCounter < maxChatHeight) {
                sprite.visible = true;
                sprite.pivot.y = sprite.height;
                sprite.y = heightCounter * -1;
            } else {
                sprite.visible = false;
            }
            heightCounter += sprite.height;
        }
    }

    function Message(sprite) {
        this.sprite = sprite;
        this.permanent = false;
        this.time = 0;
        this.fadeAt = 10000;
        this.removeAt = 15000;
    }
    Message.prototype.recalculateAlpha = function recalculateAlpha() {
        if (this.sprite) {
            this.sprite.alpha = (this.time < this.fadeAt) ? 1 : (1 - ((this.time - this.fadeAt) / (this.removeAt - this.fadeAt)));
        }
    };
}

module.exports = ChatClient;
module.exports.$inject = ['Game', 'system/Renderer', 'lib/pixi.js', 'documentReady', 'ClientActions'];
