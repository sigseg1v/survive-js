"use strict";
var deepfreeze = require('deep-freeze');

function SharedConstants(game) {
    var self = this;

    self.weapons = {
        MELEE: 0,
        RIFLE: 1
    };

    deepfreeze(self);
}

module.exports = SharedConstants;
module.exports.$inject = [ 'Game' ];
