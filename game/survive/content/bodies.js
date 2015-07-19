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
    } else if (name === 'Mineral') {
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
            labels: ['wall', 'resource']
        });
    } else if (name === 'Base') {
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
            labels: ['building', 'healable', 'base']
        });
    } else if (name === 'Tank') {
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
            labels: ['building', 'healable']
        });
    } else if (name === 'Generator') {
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
            labels: ['building', 'generator', 'healable']
        });
    } else if (name === 'Healer') {
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
            labels: ['building', 'chargeable', 'healer', 'healable']
        });
    } else if (name === 'Cannon') {
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
            labels: ['building', 'chargeable', 'healable']
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
    } else if (name === 'UseCircle'){
        body = physics.body('ghost-circle', {
            x: 0,
            y: 0,
            radius: 0.45,
            treatment: 'dynamic',
            options: {
                integrationMode: 'disabled'
            }
        });
    } else if (name === 'GatherCircle'){
        body = physics.body('ghost-circle', {
            x: 0,
            y: 0,
            radius: 1.5,
            treatment: 'dynamic',
            options: {
                integrationMode: 'disabled'
            }
        });
    }
    return body;
};
