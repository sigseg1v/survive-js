"use strict";
var isServer = typeof window === 'undefined';

// bodies for physics movement calculations (simpler bodies here will improve performance a lot)
var bodies = {
    "Wall": function (physics) {
        return physics.body('base-convex-polygon', {
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
            options: {
                integrationMode: 'disabled',
                fixedOrientation: true
            }
        });
    },
    "Player": function (physics) {
        return physics.body('ghost-circle', {
            x: 0,
            y: 0,
            radius: 0.3,
            restitution: 0,
            cof: 0,
            treatment: 'dynamic',
            options: {
                integrationMode: 'future'
            }
        });
    },
    "Zombie": function (physics) {
        return physics.body('collision-circle', {
            x: 0,
            y: 0,
            radius: 0.3,
            restitution: 0,
            cof: 0,
            treatment: 'dynamic',
            options: {
                integrationMode: isServer ? 'normal' : 'future' // server controls enemy physics, client loads
            }
        });
    }
};

// bodies for attack / ability (not movement) hit detection -- can be more complex than the physics bodies
var hitboxes = {
    "Zombie": function (physics) {
        return physics.body('base-convex-polygon', {
            x: 0,
            y: 0,
            vertices: [
                { x:  0.0, y: -0.4 },
                { x: -0.2, y: -0.3 },
                { x: -0.3, y: 0 },
                { x: -0.2, y:  0.3 },
                { x:  0.0, y:  0.4 },
                { x:  0.2, y:  0.3 },
                { x:  0.3, y: 0 },
                { x:  0.2, y: -0.3 }
            ],
            offset: new physics.vector(0, 0.2),
            restitution: 0,
            cof: 0,
            treatment: 'dynamic',
            options: {
                integrationMode: 'disabled',
                fixedOrientation: true
            }
        });
    },
    "AttackArc1": function (physics) {
        return physics.body('convex-polygon', {
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
};

module.exports = function loadBody(physics, name) {
    return {
        body: bodies[name] ? bodies[name].call(null, physics) : null,
        hitbox: hitboxes[name] ? hitboxes[name].call(null, physics) : null
    };
};
