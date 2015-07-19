"use strict";
var limit = require('../../etc/ratelimiter.js');

function DayNightCycleClient(world, game, renderer, pixi) {
    var self = this;
    var mode = '';
    var stateData = null;
    var nextChange = 0;

    var info = new pixi.Text('', { font: 'bold 16px Michroma', fill: 'black', stroke: 'white', strokeThickness: 3 });
    info.visible = false;
    info.x = 10;
    info.y = 10;
    renderer.stage.addChild(info);

    self.step = function (time) {
        switch(mode) {
            case 'not-started':
                info.visible = true;
                info.text = 'Game will not start until a base is constructed.';
                break;
            case 'day':
                info.visible = true;
                info.text = 'Day remains for ' + Math.max((stateData.snapshotTime - time.absoluteTotal + stateData.remaining) / 1000, 0).toFixed() + ' seconds...';
                break;
            case 'night':
                info.visible = true;
                info.text = stateData.enemiesRemaining + ' enemies remain...';
                break;
            default:
                info.visible = false;
                break;
        }
    };

    self.update = function update(data) {
        var changed = (mode != data.mode);
        mode = data.mode;
        stateData = data;
        stateData.snapshotTime = game.getTime().absoluteTotal;
        if (changed) {
            game.events.emit('dayNightCycle:' + mode, data);
        }
    };
}

module.exports = DayNightCycleClient;
module.exports.$inject = ['World', 'Game', 'system/Renderer', 'lib/pixi.js'];
