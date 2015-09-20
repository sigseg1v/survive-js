"use strict";
var deepfreeze = require('deep-freeze');

module.exports = deepfreeze({
    weapons: {
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
    }
});
