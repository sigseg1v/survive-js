"use strict";
var limit = require('../../etc/ratelimiter.js');

function DrawBuildMenu(game, pixi, renderer) {

    var buildMenu = new pixi.MultiStyleText('', {
        def: { font: '16px Michroma', fill: 'white', stroke: 'black', strokeThickness: 3 },
        red: { font: '16px Michroma', fill: '#FD4554', stroke: 'black', strokeThickness: 2 },
        green: { font: '16px Michroma', fill: '#4AD34E', stroke: 'black', strokeThickness: 2 },
        blue: { font: '16px Michroma', fill: '#0E91C9', stroke: 'black', strokeThickness: 2 },
        purple: { font: '16px Michroma', fill: '#AC40E3', stroke: 'black', strokeThickness: 2 },
        name: { font: '16px Michroma', fill: 'white', stroke: 'black', strokeThickness: 3 }
    });
    buildMenu.visible = false;
    buildMenu.x = 10;
    buildMenu.y = 100;
    renderer.stage.addChild(buildMenu);

    game.events.on('buildmenu-open', function (menu) {
        buildMenu.text = menu.reduce(function(prev, item, i) {
            return prev +
                '\n<name>' + (i+1).toString() + '. ' + item.name + '</name>' +
                '\n    :: <red>' + item.cost[0] + '</red> <green>' + item.cost[1] + '</green> <blue>' + item.cost[2] + '</blue> <purple>' + item.cost[3] + '</purple>';
            }, 'Build Menu:');
        buildMenu.visible = true;
    });
    game.events.on('buildmenu-close', function () {
        buildMenu.visible = false;
    });

    this.step = null;
}

module.exports = DrawBuildMenu;
module.exports.$inject = ['Game', 'lib/pixi.js', 'system/Renderer'];
