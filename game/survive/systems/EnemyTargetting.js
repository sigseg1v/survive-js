"use strict";
var isServer = typeof window === 'undefined';
var limit = require('game/etc/ratelimiter');

function EnemyTargetting(container, socket, game, clientStateManager, Movable, Placement, Path, world, physics, pathfinder) {
    var WP_TAG_RANGE = 1;

    var getPlayers = clientStateManager.getAllPlayers.bind(clientStateManager);
    var enemies = [];

    game.events.on('addEntity', onAddEntity);
    game.events.on('removeEntity', onRemoveEntity);
    game.events.on('path:waypoints-expired', onWaypointsExpired);

    var calculatePaths_limit = limit(2000, calculatePaths);

    this.step = function step(time) {
        calculatePaths_limit();
    };

    function onAddEntity(ent) {
        if (ent && ent.components.movable && ent.components.movable.body.labels.indexOf('enemy') !== -1) {
            enemies.push(ent);
        }
    }

    function onRemoveEntity(ent) {
        if (ent && ent.components.movable && ent.components.movable.body.labels.indexOf('enemy') !== -1) {
            var index = enemies.indexOf(ent);
            if (index !== -1) {
                enemies.splice(index, 1);
            }
        }
    }

    function onWaypointsExpired(entities) {
        var players = getPlayers();

        if (players.length === 0) {
            return;
        }

        entities.forEach(function (ent) {
            if (ent && ent.components.movable && ent.components.movable.body.labels.indexOf('enemy') !== -1) {
                calculatePath(players, ent);
            }
        });
    }

    function calculatePaths() {
        var i, len;
        var players = getPlayers();

        if (players.length === 0) {
            return;
        }

        pathfinder.clearCache();

        for (i = 0, len = enemies.length; i < len; i++) {
            calculatePath(players, enemies[i]);
        }
    }

    function calculatePath(players, enemy) {
        if (enemy.components.path) {
            var startPos = enemy.components.placement.position;
            var targetEntityId = enemy.components.path.targetEntityId;
            if (!targetEntityId) {
                targetEntityId = players[Math.floor(Math.random() * players.length)].id;
                enemy.components.path.targetEntityId = targetEntityId;
            }
            var target = world.entityById(targetEntityId);
            if (!target) {
                enemy.components.path.targetEntityId = null; // should we immediately recalculate here when target is lost? -- probably not too much of a loss
                return;
            }
            var endPos = target.components.placement.position;
            var path = pathfinder.findPath({
                start: startPos,
                end: endPos,
                cache: true,
                maxIterations: 10000
            });
            enemy.components.path.path = path;
            if (path === null) {
                // if we can't find a path, find a new target next time
                enemy.components.path.targetEntityId = null;
            }
        }
    }
}

module.exports = EnemyTargetting;
module.exports.$inject = ['$container', 'socket', 'Game', 'ClientStateManager', 'component/Movable', 'component/Placement', 'component/Path', 'World', 'lib/physicsjs', 'Pathfinder'];
