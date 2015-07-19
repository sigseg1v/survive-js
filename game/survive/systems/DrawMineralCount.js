"use strict";
var limit = require('../../etc/ratelimiter.js');

function DrawMineralCount(game, pixi, renderer, Resource) {
    var player = null;
    game.events.on('playerLoaded', function (ent) { player = ent; });

    var mineralText = new pixi.MultiStyleText('', {
        red: { font: 'bold 16px Michroma', fill: '#FD4554', stroke: 'white', strokeThickness: 2 },
        green: { font: 'bold 16px Michroma', fill: '#4AD34E', stroke: 'white', strokeThickness: 2 },
        blue: { font: 'bold 16px Michroma', fill: '#0E91C9', stroke: 'white', strokeThickness: 2 },
        purple: { font: 'bold 16px Michroma', fill: '#AC40E3', stroke: 'white', strokeThickness: 2 }
    });
    mineralText.x = 10;
    mineralText.y = 5;
    renderer.stage.addChild(mineralText);

    this.step = function (time) {
        if (player) {
            var miner = player.components.miner;
            var red = Math.floor(miner.getResource(Resource.ResourceType.RED) || 0);
            var green = Math.floor(miner.getResource(Resource.ResourceType.GREEN) || 0);
            var blue = Math.floor(miner.getResource(Resource.ResourceType.BLUE) || 0);
            var purple = Math.floor(miner.getResource(Resource.ResourceType.PURPLE) || 0);
            var resourceString = '<red>' + red + '</red>   <green>' + green + '</green>   <blue>' + blue + '</blue>   <purple>' + purple + '</purple>';
            mineralText.text = resourceString;
            mineralText.x = renderer.renderer.width - mineralText.width - 10;
        }
    };
}

module.exports = DrawMineralCount;
module.exports.$inject = ['Game', 'lib/pixi.js', 'system/Renderer', 'component/Resource'];
