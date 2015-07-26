"use strict";
var limit = require('game/etc/ratelimiter');

function DynamicPhysicsSyncServer(container, socket, world, game) {
    var PHYSICS_SYNC_POSITION_ERROR = 100;

    var sendPhysicsData_limit = limit(100, sendPhysicsData);
    this.step = function step() {
        sendPhysicsData_limit();
    };

    function stateToTransportFormat(state) {
        return [
            Math.round(state.pos.x * PHYSICS_SYNC_POSITION_ERROR) / PHYSICS_SYNC_POSITION_ERROR,
            Math.round(state.pos.y * PHYSICS_SYNC_POSITION_ERROR) / PHYSICS_SYNC_POSITION_ERROR,
            Math.round(state.vel.x * 10000) / 100,
            Math.round(state.vel.y * 10000) / 100,
            Math.round(state.angular.pos * 100) / 100,
            Math.round(state.angular.vel * 10000) / 100,
            Math.round(state.angular.acc)
        ];
    }

    function sendPhysicsData() {
        var enemies = world.physics.find({
            labels: { $in: ['enemy'] }
        });
        var physicsData = enemies.map(function (enemy) {
            return {
                id: enemy.entity().id,
                state: stateToTransportFormat(enemy.state)
            };
        });
        Object.keys(socket.nsps['/'].connected).forEach(function (socketId) {
            // this data isn't filtered to client loaded chunks, but since enemies are
            // normally in proximity of players, this shouldn't be too much extra data
            socket.nsps['/'].connected[socketId].volatile.emit('physicsDataRaw', {
                data: physicsData,
                time: new Date()
            });
        });
    }
}

module.exports = DynamicPhysicsSyncServer;
module.exports.$inject = ['$container', 'socket', 'World', 'Game'];
