"use strict";
var isServer = typeof window === 'undefined';
var limit = require('../../etc/ratelimiter.js');

function EnemyTargetting(container, Movable, Placement, Path, world, physics, pathfinder) {
    var WP_TAG_RANGE = 1;

    var calculatePaths_limit = limit(2000, calculatePaths);

    this.step = function step(time) {
        calculatePaths_limit();
    };

    function calculatePaths() {
        var i, len, enemy, player;
        var players = world.physics.find({
            labels: { $in: ['player'] }
        }).map(function (body) {
            return body.entity();
        });
        var enemies = world.physics.find({
            labels: { $in: ['enemy'] }
        }).map(function (body) {
            return body.entity();
        });

        if (players.length === 0) {
            return;
        }

        pathfinder.clearCache();

        for (i = 0, len = enemies.length; i < len; i++) {
            enemy = enemies[i];

            if (enemy.components.path) {
                var startPos = enemy.components.placement.position;
                var endPos = players[Math.floor(Math.random() * players.length)].components.placement.position;
                enemy.components.path.path = pathfinder.findPath({
                    start: startPos,
                    end: endPos,
                    cache: true
                });
            }
        }
    }
}

module.exports = EnemyTargetting;
module.exports.$inject = ['$container', 'component/Movable', 'component/Placement', 'component/Path', 'World', 'lib/physicsjs', 'Pathfinder'];
