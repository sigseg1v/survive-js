"use strict";
var isServer = typeof window === 'undefined';
var limit = require('game/etc/ratelimiter');

function EnemyTargetting(container, socket, game, clientStateManager, Movable, Placement, Path, Aggro, world, physics, pathfinder) {
    var WP_TAG_RANGE = 1;

    var getPlayers = clientStateManager.getAllPlayers.bind(clientStateManager);

    game.events.on('path:waypoints-expired', onWaypointsExpired);

    var calculatePaths_limit = limit(2000, calculatePaths);

    this.step = function step(time) {
        calculatePaths_limit();
    };

    function onWaypointsExpired(entities) {
        var players = getPlayers();

        if (players.length === 0) {
            return;
        }

        entities.forEach(function (ent) {
            if (ent && ent.components.aggro) {
                calculatePath(players, ent);
            }
        });
    }

    function calculatePaths() {
        var i, len;
        var players = getPlayers(); // TODO -- read targetLabels off aggro component data

        if (players.length === 0) {
            return;
        }

        pathfinder.clearCache();

        for (i = 0, len = Aggro.entities.length; i < len; i++) {
            calculatePath(players, Aggro.entities[i]);
        }
    }

    function calculatePath(players, enemy) {
        if (!enemy.components.path) {
            return;
        }
        var scratch = physics.scratchpad();
        var aggro = enemy.components.aggro;
        var startPos = enemy.components.placement.position;
        var targetEntityId = enemy.components.path.targetEntityId;
        if (!targetEntityId) {
            targetEntityId = players[Math.floor(Math.random() * players.length)].id;
            enemy.components.path.targetEntityId = targetEntityId;
        }
        var target = world.entityById(targetEntityId);
        if (!target || scratch.vector().clone(target.components.placement.position).vsub(startPos).norm() > aggro.radius)  {
            enemy.components.path.targetEntityId = null;
            scratch.done();
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
        scratch.done();
    }
}

module.exports = EnemyTargetting;
module.exports.$inject = ['$container', 'socket', 'Game', 'ClientStateManager', 'component/Movable', 'component/Placement', 'component/Path', 'component/Aggro', 'World', 'lib/physicsjs', 'Pathfinder'];
