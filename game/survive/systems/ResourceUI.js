"use strict";
var constants = require('game/survive/game/SharedConstants');

function ResourceUI(game, renderer, pixi, playerState) {
    var self = this;

    var hudStyle = {
        def: { font: '12px Michroma', fill: 'gray', stroke: 'white', strokeThickness: 1 },
        name: { font: 'bold 12px Michroma', fill: 'black', stroke: 'white', strokeThickness: 1 }
    };

    var weaponText = new pixi.MultiStyleText('', hudStyle);
    weaponText.x = renderer.renderer.width - 200 - 10;
    weaponText.y = renderer.renderer.height - 16 - 10;

    renderer.stage.addChild(weaponText);

    game.events.on('playerState:update', function (state) {
        var weapon = Object.keys(constants.weapons)
            .map(function (k) { return constants.weapons[k]; })
            .find(function (weapon) { return weapon.id === state.weapon; });
        if (weapon) {
            weaponText.setText('Weapon: <name>' + weapon.name + '</name>');
        }
    });

    self.step = null;
}

module.exports = ResourceUI;
module.exports.$inject = ['Game', 'system/Renderer', 'lib/pixi.js', 'PlayerState'];
