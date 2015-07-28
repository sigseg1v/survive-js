"use strict";
var isServer = typeof window === 'undefined';

module.exports = function loadBody(physics, name) {
    var body;
    if (name === 'Wall') {
        body = physics.body('convex-polygon', {
            x: 0,
            y: 0,
            restitution: 0,
            vertices: [
                { x:  -0.5, y: -0.5 },
                { x:   0.5, y: -0.5 },
                { x:   0.5, y:  0.5 },
                { x:  -0.5, y:  0.5 }
            ],
            treatment: 'static',
            labels: ['wall', 'destroyable']
        });
    } else if (name === 'Player') {
        body = physics.body('ghost-circle', {
            x: 0,
            y: 0,
            radius: 0.3,
            restitution: 0,
            cof: 0,
            treatment: 'dynamic',
            options: {
                integrationMode: 'future'
            },
            labels: ['player']
        });
    } else if (name === 'GenericEnemy') {
        body = physics.body('collision-circle', {
            x: 0,
            y: 0,
            radius: 0.3,
            restitution: 0,
            cof: 0,
            treatment: 'dynamic',
            options: {
                integrationMode: isServer ? 'normal' : 'future' // server controls enemy physics, client loads
            },
            labels: ['enemy']
        });
    } else if (name === 'AttackArc1'){
        body = physics.body('convex-polygon', {
            x: 0,
            y: 0,
            offset: new physics.vector(0.8, 0),
            vertices: [
                { x:  0.0, y:  0.0 },
                { x:  1.0, y: -0.5 },
                { x:  1.2, y: -0.2 },
                { x:  1.2, y:  0.2 },
                { x:  1.0, y:  0.5 }
            ],
            treatment: 'dynamic',
            options: {
                integrationMode: 'disabled'
            }
        });
    }
    return body;
};
