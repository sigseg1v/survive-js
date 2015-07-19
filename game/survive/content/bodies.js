"use strict";
var isServer = typeof window === 'undefined';

module.exports = function loadBody(physics, name) {
    var body;
    if (name === 'Wall') {
        body = physics.body('convex-polygon', {
            x: 0,
            y: 0,
            vertices: [
                { x:  0,         y:  1      },
                { x:  0.8660254, y:  0.5    },
                { x:  0.8660254, y: -0.5    },
                { x:  0,         y: -1      },
                { x: -0.8660254, y: -0.5    },
                { x: -0.8660254, y:  0.5    }
            ],
            treatment: 'static',
            labels: ['wall', 'destroyable']
        });
    } else if (name === 'Player'){
        body = physics.body('ghost-circle', {
            x: 0,
            y: 0,
            radius: 0.35,
            treatment: 'dynamic',
            options: {
                integrationMode: 'future'
            },
            labels: ['player']
        });
    } else if (name === 'GenericEnemy'){
        body = physics.body('collision-circle', {
            x: 0,
            y: 0,
            radius: 0.35,
            treatment: 'dynamic',
            options: {
                integrationMode: isServer ? 'normal' : 'future' // server controls enemy physics, client loads
            },
            labels: ['enemy']
        });
    }
    return body;
};
