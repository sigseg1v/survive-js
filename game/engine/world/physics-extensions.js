"use strict";
var replayIntegrator = require('game/engine/world/replay-integrator');
var broadphaseQuadtree = require('game/engine/world/broadphase-quadtree');
var Hex = require('game/engine/world/Hex');
var Block = require('game/engine/world/Block');

function extend(physics) {

    physics.scratchpad.register('hex', Hex);
    physics.scratchpad.register('block', Block);
    physics.scratchpad.maxIndex = Infinity;

    physics.body.mixin({
        entity: function (val) {
            if (val !== undefined) {
                this._entity = val;
            }

            return this._entity;
        }
    });

    physics.body.mixin({
        collisionMode: function (val) {
            if (val !== undefined) {
                this._collisionMode = val;
            }

            return this._collisionMode;
        }
    });

    physics.body.mixin({
        fixedOrientation: function (val) {
            var body = this;

            if (val && !body._fixedOrientation) {
                // init
                body._fixedOrientation = true;

                body._storedAngularPos = 0;
                body._storedOldAngularPos = 0;
                Object.defineProperty(body.state.angular, 'pos', {
                    get: function () { return 0; },
                    set: function (val) { body._storedAngularPos = val; }
                });
                Object.defineProperty(body.state.old.angular, 'pos', {
                    get: function () { return 0; },
                    set: function (val) { body._storedOldAngularPos = val; }
                });
            } else if (val !== undefined) { // guard against getter where val is undefined
                if (!val && body._fixedOrientation) {
                    delete body.state.angular.pos;
                    body.state.angular.pos = body._storedAngularPos || 0;
                    delete body.state.old.angular.pos;
                    body.state.old.angular.pos = body._storedOldAngularPos || 0;
                }

                // just set
                body._fixedOrientation = !!val;
            }

            return body._fixedOrientation || false;
        }
    });

    physics.body.mixin({
        integrationMode: function (val) {
            if (val !== undefined) {
                this._integrationMode = val;
            }
            return (this._integrationMode === undefined) ? 'normal' : this._integrationMode;
        }
    });

    physics.body.mixin({
        movespeed: function (val) {
            if (val !== undefined) {
                this._movespeed = Number(val);
            }
            return (this._movespeed === undefined) ? 0 : this._movespeed;
        }
    });

    physics.body.mixin({
        addReplayState: function (state, time) {
            if (this._stateHistory === undefined) {
                this._stateHistory = [];
            }
            if (this._stateHistory.length > 0 && time < this._stateHistory[this._stateHistory.length - 1].time) {
                console.log("Attempt to insert older data into state history.");
                return;
            }
            this._stateHistory.push({
                state: state,
                time: time,
                previous: this.getMostRecentReplayState()
            });
        },

        // get the nearest state that is later than a specified time
        getFutureReplayState: function (currentTime) {
            var history = this._stateHistory;
            if (history === undefined || history.length === 0) {
                return null;
            }
            var future = null;
            for (var i = 0; i < history.length; i++) {
                if (history[i].time > currentTime) {
                    future = history[i];
                    break;
                }
            }
            return future;
        },

        getMostRecentReplayState: function () {
            var history = this._stateHistory;
            if (history === undefined || history.length === 0) {
                return null;
            }
            return history[history.length - 1];
        },

        clearOlderReplayStates: function (state) {
            var history = this._stateHistory;
            if (history === undefined || history.length === 0) {
                return 0;
            }
            var index = history.indexOf(state);
            if (index > 0) {
                history.splice(0, index);
            }
            return index + 1;
        },

        clearOldestReplayState: function () {
            var history = this._stateHistory;
            if (history === undefined || history.length === 0) {
                return null;
            }
            return history.shift();
        },

        clearAllReplayStates: function () {
            var history = this._stateHistory;
            if (history === undefined || history.length === 0) {
                return;
            }
            while (history.length > 0) {
                history.pop();
            }
        },

        replayStateCount: function() {
            return this._stateHistory === undefined ? 0 : this._stateHistory.length;
        }
    });

    physics.body('base-convex-polygon', 'convex-polygon', function (parent) {
        var defaults = {
            collisionMode: 'normal',
            integrationMode: 'normal',
            fixedOrientation: false
        };

        return {
            init: function init(args) {
                parent.init.call(this, args);
                var options = physics.util.extend({}, defaults, args.options);

                this.collisionMode(options.collisionMode);
                this.integrationMode(options.integrationMode);
                this.fixedOrientation(options.fixedOrientation);
            }
        };
    });

    physics.body('base-circle', 'circle', function (parent) {
        var defaults = {
            collisionMode: 'normal',
            integrationMode: 'normal',
            fixedOrientation: false
        };

        return {
            init: function init(args) {
                parent.init.call(this, args);
                var options = physics.util.extend({}, defaults, args.options);

                this.collisionMode(options.collisionMode);
                this.integrationMode(options.integrationMode);
                this.fixedOrientation(options.fixedOrientation);
            }
        };
    });

    physics.body('ghost-circle', 'base-circle', function (parent) {
        var defaults = {
            collisionMode: 'static-only'
        };

        return {
            init: function init(args) {
                parent.init.call(this, args);
                var options = physics.util.extend({}, defaults, args.options);

                this.collisionMode(options.collisionMode);
            }
        };
    });

    physics.body('collision-circle', 'base-circle', function (parent) {
        var defaults = {
            collisionMode: 'normal'
        };

        return {
            init: function init(args) {
                parent.init.call(this, args);
                var options = physics.util.extend({}, defaults, args.options);

                this.collisionMode(options.collisionMode);
            }
        };
    });

    physics.behavior('body-impulse-response-ext', 'body-impulse-response', function (parent) {
        var defaults = {};

        return {
            init: function init(options) {
                parent.init.call(this);
                this.options.defaults(defaults);
                this.options(options);
            },

            // extended
            collideBodies: function collideBodies(bodyA, bodyB, normal, point, mtrans, contact) {
                var staticOnlyA = bodyA.collisionMode() === 'static-only';
                var staticOnlyB = bodyB.collisionMode() === 'static-only';
                var staticA = bodyA.treatment === 'static';
                var staticB = bodyB.treatment === 'static';
                if ((staticOnlyA && !staticB) || (staticOnlyB && !staticA) || (staticOnlyA && staticOnlyB)) {
                    return;
                }

                parent.collideBodies.apply(this, arguments);
            }
        };
    });

    replayIntegrator.extend(physics);
    broadphaseQuadtree.extend(physics);
}

module.exports =  {
    extend: extend
};
