"use strict";
var pnow = require('performance-now');
var weakmap = require('weakmap');

var cooldownMap = new weakmap();
function timerFor(component) {
    if (!cooldownMap.has(component)) {
        cooldownMap.set(component, new CooldownData());
    }
    return cooldownMap.get(component);
}

function CooldownData() {
    this.last = 0;
}

function rateLimit(limitInterval, fn, thisArg) {
    var last = pnow();

    return executeRateLimitedFunction;

    function executeRateLimitedFunction () {
        var now = pnow();

        if (now - last > limitInterval) {
            last = now;
            return fn.call(thisArg);
        }
        return null;
    }
}
rateLimit.byCooldown = function byCooldown(component, fn, args, thisArg) {
    var timer = timerFor(component);
    var now = pnow();

    if (now - timer.last > component.cooldown) {
        timer.last = now;
        return fn.apply(thisArg, args);
    }
    return null;
};

module.exports = rateLimit;
