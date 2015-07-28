"use strict";
var deepfreeze = require('deep-freeze');

function SharedConstants(game) {
    var self = this;

    self.weapons = {
        MELEE: {
            id: 0,
            range: 1.2,
            damageMultiplier: 1
        },
        RIFLE: {
            id: 1,
            range: 8,
            damageMultiplier: 1
        }
    };

    deepfreeze(self);
}

module.exports = SharedConstants;
module.exports.$inject = [ 'Game' ];
