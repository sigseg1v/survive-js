"use strict";
var pnow = require('performance-now');
var weakmap = require('weakmap');
var EventEmitter = require('events').EventEmitter;

var cooldownMap = new weakmap();
function timerFor(component) {
    if (!cooldownMap.has(component)) {
        cooldownMap.set(component, new CooldownData(component));
    }
    return cooldownMap.get(component);
}

function CooldownData(component) {
    if (!('cooldown' in component)) {
        throw "'cooldown' property is required";
    }
    if ('globalCooldown' in component) {
        if (component.globalCooldown >= component.cooldown) {
            throw "'globalCooldown' property must be < 'cooldown' property";
        }
    }
    this.last = 0;
    this.lastGlobal = 0;
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

// rateLimiter.responsive :: returns an object that responds by emitting events for different cooldown situations
// emits:
//      "ready" -> (limiter, state, args...): emit after calling trigger(state, args) and the time since last call with same state that emitted 'ready' is greater than 'cooldown'
//      "gcd" -> (limiter, state, args...): emit after calling trigger(state, args) and the time since last call with same state that emitted 'cooldown' or 'ready' is less than 'globalCooldown' (if the option was provided)
//      "cooldown" -> (limiter, state, args...): emit after calling trigger(state, args) and the time since last call with same state is greater than 'cooldown' or 'globalCooldown' (if the option was provided)
// returned:
//      limiter = {
//          trigger(state, args): when called, evaluates rate limiting logic and emits the appropriate events with a reference to this object and the arguments that are passed into this function
//                state:
//                     cooldown (required)
//                     globalCooldown (optional)
//                args: passed on to the handlers of emit events
//          check(state): returns an object detailing what event trigger will run, and a completion function allowing triggering after with <retval>.trigger(args)
//          on: allows registering to emitted events (with the EventEmitter.on interface)
//          clearReadyCooldown(state): clear the cooldown timer for this state. This is useful if, for example, the ready state fires but there was nothing to do and you want to make things ready again after the gcd.
//          clearAllCooldowns(state): clear all timers for this state
//      }
// notes:
//      -- cooldown data is keyed with the object reference of the state object, so passing in the same object will always use the same stored cooldown data for that object
rateLimit.responsive = function () {
    var emitter = new EventEmitter();
    var limiter = {
        trigger: function trigger(state, args) {
            var timer = timerFor(state);
            var now = pnow();
            var eventName;
            if (('globalCooldown' in state) && (now - timer.lastGlobal <= state.globalCooldown)) {
                eventName = 'gcd';
            } else if (now - timer.last <= state.cooldown) {
                eventName = 'cooldown';
                timer.lastGlobal = now;
            } else {
                eventName = 'ready';
                timer.lastGlobal = now;
                timer.last = now;
            }
            emitter.emit.apply(emitter, [eventName, limiter, state].concat(args));
            return {
                event: eventName
            };
        },
        check: function check(state) {
            var timer = timerFor(state);
            var now = pnow();
            var eventName;
            if (('globalCooldown' in state) && (now - timer.lastGlobal <= state.globalCooldown)) {
                eventName = 'gcd';
            } else if (now - timer.last <= state.cooldown) {
                eventName = 'cooldown';
            } else {
                eventName = 'ready';
            }
            var calculationTime = now;
            return {
                event: eventName,
                trigger: function trigger(args) {
                    if (eventName === 'gcd') {
                        timer.lastGlobal = calculationTime;
                    } else if (eventName === 'cooldown') {
                        timer.lastGlobal = calculationTime;
                        timer.last = calculationTime;
                    } else {
                        timer.lastGlobal = calculationTime;
                        timer.last = calculationTime;
                    }
                    emitter.emit.apply(emitter, [eventName, limiter, state].concat(args));
                }
            };
        },
        clearReadyCooldown: function clearReadyCooldown(state) {
            var timer = timerFor(state);
            timer.last = 0;
        },
        clearAllCooldowns: function clearAllCooldowns(state) {
            var timer = timerFor(state);
            timer.last = 0;
            timer.lastGlobal = 0;
        },
        on: function on() {
            emitter.on.apply(emitter, arguments);
            return limiter;
        }
    };
    return limiter;
};

module.exports = rateLimit;
