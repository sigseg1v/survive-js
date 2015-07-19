"use strict";

function GameTuning(game) {
    var self = this;

    // defineEmittableProperty('buildingCostMultiplier', 1, Number);

    function defineEmittableProperty(name, defaultValue, setter) {
        var backingProperty = defaultValue;
        Object.defineProperty(self, name, {
            get: function () { return backingProperty; },
            set: function (val) {
                backingProperty = (setter === undefined) ? val : setter(val);
                game.events.emit('tuning:' + name, backingProperty);
            }
        });
    }
}

module.exports = GameTuning;
module.exports.$inject = [ 'Game' ];
