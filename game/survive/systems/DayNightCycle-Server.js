"use strict";
var limit = require('../../etc/ratelimiter.js');
var levels = require('../../../assets/scripts/levels.js');

function DayNightCycleServer(container, socket, world, game, pathfinder) {
    var self = this;
    var state = new NotStartedWorldState();

    self.step = function step(time) {
        if (state.complete) {
            state = state.next();
            state.sendUpdate();
        }
    };

    game.events.on('cheat:advanceStage', function () {
        if (state && !state.complete) {
            state.complete = true;
        }
    });

    function findTarget() {
        var base = world.physics.findOne({
            labels: { $in: ['base'] }
        });
        if (base) {
            return base.state.pos;
        } else {
            return null;
        }
        // var players = world.physics.find({
        //     labels: { $in: ['player'] }
        // });
        // if (players.length > 0) {
        //     return players[Math.floor(Math.random() * players.length)].entity().components.placement.position;
        // } else {
        //     return null;
        // }
    }

    function pathUnitToTargetPosition(unit, target) {
        var pathComp = unit.components.path;
        pathComp.currentWaypoint = null;
        pathComp.path = pathfinder.findPath({
            start: unit.components.movable.body.state.pos,
            end: target,
            // wallsOnly: true,
            cache: true
        });
    }

    self.getState = function getState() {
        return state;
    };

    function sendStateUpdateToClients(state) {
        game.events.emit('dayNightCycle:any', state);
        game.events.emit('dayNightCycle:' + state.mode, state);
        socket.emit('dayNightCycle', state);
    }

    function NotStartedWorldState(options) {
        var self = this;
        self.mode = 'not-started';
        self.complete = false;

        game.events.on('addEntity', onAddEntity);
        function onAddEntity(ent) {
            if (ent && ent.components.base) {
                self.complete = true;
                game.events.removeListener('addEntity', onAddEntity);
            }
        }

        self.next = function next() {
            return new DayWorldState();
        };
        self.sendUpdate = function sendUpdate() {
            sendStateUpdateToClients(self);
        };
        self.toJSON = function () {
            return {
                mode: self.mode
            };
        };
    }

    // options:
    //      lastLevel (optional)
    function DayWorldState(options) {
        var self = this;
        options = options || {};
        var start = game.getTime().absoluteTotal;
        var lastLevel = options.hasOwnProperty('lastLevel') ? options.lastLevel : -1;

        self.mode = 'day';
        self.duration = 60 * 1000;
        Object.defineProperty(self, 'remaining', {
            get: function () { return start + self.duration - game.getTime().absoluteTotal; }
        });
        Object.defineProperty(self, 'elapsed', {
            get: function () { return game.getTime().absoluteTotal - start; }
        });
        var completeOverride = null;
        Object.defineProperty(self, 'complete', {
            get: function () { return (completeOverride === null) ? self.remaining <= 0 : completeOverride; },
            set: function (val) { completeOverride = val; }
        });

        self.next = function next() {
            return new NightWorldState({
                level: lastLevel + 1
            });
        };
        self.sendUpdate = function sendUpdate() {
            sendStateUpdateToClients(self);
        };
        self.toJSON = function () {
            return {
                mode: self.mode,
                duration: self.duration,
                remaining: self.remaining,
                elapsed: self.elapsed
            };
        };
    }

    // options:
    //      level (required)
    function NightWorldState(options) {
        var self = this;
        var start = game.getTime().absoluteTotal;
        var currentWaveIntervals = [];
        var enemies = {};

        self.mode = 'night';
        self.level = (function() { var levelNumber = options.level; while(!levels[levelNumber]) { levelNumber--; } return levelNumber; })();
        self.enemiesRemaining = 0;
        var totalEnemiesSpawned = 0;
        var enemiesToSpawn = levels[self.level].enemySets.reduce(function (num, next) {
            return num + next.amount;
        }, 0);
        Object.defineProperty(self, 'elapsed', {
            get: function () { return game.getTime().absoluteTotal - start; }
        });
        var completeOverride = null;
        Object.defineProperty(self, 'complete', {
            get: function () { return (completeOverride === null) ? (self.enemiesRemaining <= 0 && totalEnemiesSpawned >= enemiesToSpawn) : completeOverride; },
            set: function (val) { completeOverride = val; }
        });

        self.startWave = function startWave() {
            levels[self.level].enemySets.forEach(function (set) {
                var enemiesSpawned = 0;

                var interval = setInterval(function () {
                    if (enemiesSpawned >= set.amount) {
                        if (currentWaveIntervals.indexOf(interval) !== -1) {
                            currentWaveIntervals.splice(currentWaveIntervals.indexOf(interval), 1);
                        }
                        clearInterval(interval);
                        return;
                    }
                    var enemy = container.resolve('entity/EnemyEntity/' + set.type);
                    enemy.components.placement.position = { x: 0, y: 0 };
                    enemies[enemy.id] = {
                        unit: enemy,
                        target: findTarget()
                    };

                    world.addEntity(enemy);
                    totalEnemiesSpawned++;
                    enemiesSpawned++;
                    self.enemiesRemaining++;
                }, set.timer);

                currentWaveIntervals.push(interval);
            });

            var pathInterval = setInterval(function () {
                Object.keys(enemies).forEach(function (key) {
                    var data = enemies[key];
                    if (data.target === null) {
                        data.target = findTarget();
                    }
                    if (data.target !== null) {
                        pathUnitToTargetPosition(data.unit, data.target);
                    }
                });
            }, 2000);
            currentWaveIntervals.push(pathInterval);

            var updateClientsInterval = setInterval(function () {
                self.sendUpdate();
            }, 3000);
            currentWaveIntervals.push(updateClientsInterval);

            game.events.on('removeEntity', onRemoveEntity);
        };

        self.endWave = function endWave() {
            game.events.removeListener('removeEntity', onRemoveEntity);
            while (currentWaveIntervals.length > 0) {
                clearInterval(currentWaveIntervals.pop());
            }

            Object.keys(enemies).forEach(function (key) {
                world.removeEntity(enemies[key].unit);
            });
            self.enemiesRemaining = 0;
        };

        self.next = function next() {
            self.endWave();
            return new DayWorldState({
                lastLevel: self.level
            });
        };
        self.sendUpdate = function sendUpdate() {
            sendStateUpdateToClients(self);
        };
        self.toJSON = function () {
            return {
                mode: self.mode,
                level: self.level,
                enemiesRemaining: self.enemiesRemaining
            };
        };

        function onRemoveEntity(removed) {
            if (enemies[removed.id]) {
                delete enemies[removed.id];
                self.enemiesRemaining = Object.keys(enemies).length;
            }
        }

        self.startWave();
    }
}

module.exports = DayNightCycleServer;
module.exports.$inject = ['$container', 'socket', 'World', 'Game', 'Pathfinder'];
