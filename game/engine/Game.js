"use strict";
var now = require('performance-now');
var EventEmitter = require('events').EventEmitter;

function Game() {
    var self = this;
    var time = {
        absoluteTotal: 0,
        elapsedSinceUpdate: 0
    };
    var systems = [];
    var systems_animation = [];
    var running = false;

    self.runModes = {
        blockingLoop: 0,
        noBlock: 1,
        noBlockWithRAF: 2,
        automaticAsync: 3
    };

    self.mode = self.runModes.blockingLoop;

    self.events = new EventEmitter();

    var i;
    var last = null;
    var elapsed = 0;
    var step = 16;
    self.run = function run() {
        if (last === null) {
            last = now();
        }
        if (self.mode === self.runModes.blockingLoop) {
            running = true;
            while (mainLoopIteration());
        } else if (self.mode === self.runModes.noBlockWithRAF) {
            if (!running) {
                running = true;
                if (typeof window === 'undefined' || !window.requestAnimationFrame) {
                    throw "window or window.requestAnimationFrame not found";
                }
                window.requestAnimationFrame(animateIteration);
            }
            return mainLoopIteration();
        } else if (self.mode === self.runModes.noBlock) {
            if (!running) {
                running = true;
            }
            return mainLoopIteration();
        } else if (self.mode === self.runModes.automaticAsync) {
            if (!running) {
                running = true;
                mainLoop_async();
            }
        } else {
            throw "invalid runMode set";
        }
    };

    self.stop = function stop() {
        running = false;
    };

    self.registerSystem = function registerSystem(system, onDraw) {
        if (onDraw) {
            if (typeof window === 'undefined' || !window.requestAnimationFrame) {
                throw "window or window.requestAnimationFrame not found";
            }
            systems_animation.push(system);
        } else {
            systems.push(system);
        }
    };

    self.stepsSince = function stepsSince(time) {
        return Math.floor((now() - time) / step);
    };

    self.getTime = function getTime() {
        return time;
    };

    function mainLoopIteration() {
        if (!running) {
            return false;
        }
        elapsed += now() - last;
        last = now();
        while (elapsed >= step) {
            elapsed -= step;
            time.elapsedSinceUpdate = step;
            time.absoluteTotal += step;
            for (i = 0; i < systems.length; i++) {
                if (systems[i].step) {
                    systems[i].step(time);
                }
            }
        }
        return true;
    }

    function mainLoop_async() {
        if (!running) {
            return false;
        }
        elapsed += now() - last;
        last = now();
        while (elapsed >= step) {
            elapsed -= step;
            time.elapsedSinceUpdate = step;
            time.absoluteTotal += step;
            for (i = 0; i < systems.length; i++) {
                if (systems[i].step) {
                    systems[i].step(time);
                }
            }
        }
        setTimeout(mainLoop_async, step);
        return true;
    }

    function animateIteration() {
        if (!running) {
            return;
        }
        for (i = 0; i < systems_animation.length; i++) {
            if (systems_animation[i].step) {
                systems_animation[i].step();
            }
        }
        window.requestAnimationFrame(animateIteration);
    }
}

module.exports = Game;
