"use strict";

function extend(physics) {

    // configuration based on the Sweep-Prune behavior of PhysicsJS
    // @license MIT
    physics.behavior('broadphase-quadtree', function (parent) {
        var uid = 1;
        var getUniqueId = function getUniqueId() {
            return uid++;
        };
        var pairHash = physics.util.pairHash;

        return {
            init: function init(options) {
                parent.init.call(this);
                this.options.defaults({
                    channel: 'collisions:candidates',
                    bounds: new physics.aabb(-640, -360, 640, 360)
                });
                this.options(options);

                this.collisionCandidates = [];

                this.clear();

                this.quadTree = new QuadTree(this.options.bounds);
            },

            clear: function clear() {
                this.movedItems = [];
                this.tracked = {};
                this.pairs = [];
                this.treeQueryOutput = [];
            },

            connect: function connect(world) {
                world.on('add:body', this.trackBody, this);
                world.on('remove:body', this.untrackBody, this);
                world.on('integrate:positions', this.updateMovedBodies, this, 2);
                world.on('integrate:positions', this.queryAndBroadcast, this, 1);

                world.getBodies().forEach(function (body) {
                    this.trackBody({ body: body });
                }, this);
            },

            disconnect: function disconnect(world) {
                world.off('add:body', this.trackBody, this);
                world.off('remove:body', this.untrackBody, this);
                world.off('integrate:positions', this.updateMovedBodies, this, 2);
                world.off('integrate:positions', this.queryAndBroadcast, this, 1);

                this.clear();
            },

            trackBody: function trackBody(data) {
                var stored = {
                    id: getUniqueId(),
                    body: data.body
                };
                this.tracked[stored.id] = stored;
                this.quadTree.insert(stored.id, stored.body.aabb());
            },

            untrackBody: function untrackBody(data) {
                Object.keys(this.tracked).some(function (key) {
                    if (this.tracked[key].body === data.body) {
                        this.quadTree.remove(this.tracked[key].id);
                        delete this.tracked[key];
                        return true;
                    }
                    return false;
                }, this);
            },

            updateMovedBodies: function findMovedBodies() {
                var tracked = this.tracked;
                var trackedKeys = Object.keys(tracked);
                var movedItems = this.movedItems;
                var item;
                var state;
                var i;
                var len = trackedKeys.length;

                while (movedItems.length > 0) {
                    movedItems.pop();
                }

                for (i = 0; i < len; i++) {
                    item = tracked[trackedKeys[i]];
                    state = item.body.state;
                    if ((state.pos.x !== state.old.pos.x) || (state.pos.y !== state.old.pos.y)) {
                        movedItems.push(item);
                        this.quadTree.update(item.id, item.body.aabb());
                    }
                }
            },

            queryAndBroadcast: function queryAndBroadcast() {
                var candidates = this.queryQuadTreeMoved();

                if (candidates.length !== 0) {
                    this._world.emit(this.options.channel, {
                        candidates: candidates
                    });
                }
            },

            queryQuadTreeMoved: function queryQuadTreeMoved() {
                var tracked = this.tracked;
                var items = this.movedItems;
                var queryItems = this.treeQueryOutput;
                var candidates = this.collisionCandidates;
                var item;
                var queryItem;
                var i;
                var len = this.movedItems.length;

                while (candidates.length > 0) {
                    candidates.pop();
                }

                while (queryItems.length > 0) {
                    queryItems.pop();
                }

                for (i = 0; i < len; i++) {
                    item = items[i];
                    this.quadTree.query(item.body.aabb(), queryItems);
                    while (queryItems.length > 0) {
                        queryItem = tracked[queryItems.pop()]; // query from quadtree returns the id in the tracked map
                        candidates.push(this.getPair(item, queryItem));
                    }
                }

                return candidates;
            },

            queryQuadTreeSingle: function queryQuadTreeSingle(body) {
                var tracked = this.tracked;
                var queryItems = this.treeQueryOutput;
                var candidates = this.collisionCandidates;
                var queryItem;
                var tempTrackedBody = {
                    id: getUniqueId(),
                    body: body
                };

                while (candidates.length > 0) {
                    candidates.pop();
                }

                while (queryItems.length > 0) {
                    queryItems.pop();
                }

                this.quadTree.query(body.aabb(), queryItems);
                while (queryItems.length > 0) {
                    queryItem = tracked[queryItems.pop()]; // query from quadtree returns the id in the tracked map
                    candidates.push(this.getPair(tempTrackedBody, queryItem, true));
                }

                return candidates;
            },

            getPair: function getPair(a, b, noCache){
                var hash = pairHash(a.id, b.id);

                if (hash === false){
                    return null;
                }

                var c = this.pairs[hash];

                if (!c) {
                    c = {
                        bodyA: a.body,
                        bodyB: b.body
                    };
                    if (!noCache) {
                        this.pairs[hash] = c;
                    }
                }

                return c;
            },
        };
    });

    function QuadTree(bounds) {
        this.root = new QuadTreeNode(bounds);
        this.splitThreshold = 8;
        this.itemDataMap = {};
    }

    QuadTree.prototype.insert = function insert(item, position) {
        if (!position || position.hw === 0 || position.hh === 0) {
            throw "Invalid QuadTree item placement.";
        }
        if (this.itemDataMap[item]) {
            throw "QuadTree insertion collision; can only insert same item once.";
        }
        var result = insertRecur.call(this, item, position, this.root);
        if (!result) {
            console.log("Item does not fit within the bounds of QuadTree.");
        }
        return result;
    };

    QuadTree.prototype.update = function update(item, position) {
        // @ifdef DEBUG
        if (item === null || item === undefined) {
            throw "Item must be set.";
        }
        // @endif
        var oldPosition = this.itemDataMap[item].position;
        if (oldPosition.x === position.x && oldPosition.y === position.y) {
            return;
        }
        this.itemDataMap[item].position = physics.aabb.clone(position);
        if (this.positionContains(this.itemDataMap[item].node.position, position)) {
            pushItemDown.call(this, item);
        } else {
            pullItemUp.call(this, item);
        }
    };

    // check if rectangle a contains rectangle b
    QuadTree.prototype.positionContains = function positionContains(a, b) {
        var scratch = physics.scratchpad();
        var b_topLeft = scratch.vector().set(b.x - b.hw, b.y - b.hh);
        var b_bottomRight = scratch.vector().set(b.x + b.hw, b.y + b.hh);
        return scratch.done(physics.aabb.contains(a, b_topLeft) && physics.aabb.contains(a, b_bottomRight));
    };

    QuadTree.prototype.remove = function remove(item) {
        // @ifdef DEBUG
        if (item === null || item === undefined) {
            throw "Item must be set.";
        }
        // @endif
        if (this.itemDataMap[item]) {
            var node = this.itemDataMap[item].node;
            node.remove(item);

            while (node !== null) {
                if (node.items.length < this.splitThreshold) {
                    tryCollapseChildNodes.call(this, node);
                }
                node = node.parent;
            }
        } else {
            console.log("Item was not found in QuadTree during removal.");
        }
    };

    QuadTree.prototype.query = function query(area, list) {
        innerQuery.call(this, this.root, area, list);
    };

    QuadTree.prototype.countItems = function countItems() {
        function countInner(node, all) {
            node.items.forEach(function (item) {
                all.push(item);
            });
            node.children.forEach(function (child) {
                countInner(child, all);
            });
        }
        var all = [];
        countInner(this.root, all);
        return all.length;
    };

    function innerQuery(node, area, list) {
        // jshint validthis: true
        if (physics.aabb.overlap(node.position, area)) {
            node.items.forEach(function (item) {
                var itemPos = this.itemDataMap[item].position;
                if (this.positionContains(area, itemPos) || physics.aabb.overlap(itemPos, area)) {
                    list.push(item);
                }
            }, this);
            node.children.forEach(function (child) {
                innerQuery.call(this, child, area, list);
            }, this);
        }
    }

    // Add item explicitly to this node without checking if it can go deeper.
    // Note: does not split node if the split threshold is exceeded.
    function insertExplicit(item, position, node) {
        // jshint validthis: true
        // @ifdef DEBUG
        if (item === null || item === undefined) {
            throw "Item must be set.";
        }
        // @endif
        if (this.positionContains(node.position, position)) {
            insertToNode.call(this, item, position, node);
            return true;
        }
        return false;
    }

    function insertToNode(item, position, node) {
        // jshint validthis: true
        // @ifdef DEBUG
        if (item === null || item === undefined) {
            throw "Item must be set.";
        }
        // @endif
        // @ifdef DEBUG
        var entCountBefore = this.countItems();
        // @endif

        if (!node.isRootNode()) {
            node.parent.remove(item);
        }
        node.insert(item);
        this.itemDataMap[item] = {
            position: physics.aabb.clone(position),
            node: node
        };
        // @ifdef DEBUG
        var entCountAfter = this.countItems();
        if (entCountAfter < entCountBefore) {
            throw "Entity lost in QuadTree during insertToNode.";
        }
        // @endif
    }

    // Inserts item as deep as it will go, starting at the specified node.
    function insertRecur(item, position, node) {
        // jshint validthis: true
        // @ifdef DEBUG
        if (item === null || item === undefined) {
            throw "Item must be set.";
        }
        // @endif
        if (this.positionContains(node.position, position)) {
            if (node.isLeafNode()) {
                if (node.items.length < this.splitThreshold) {
                    insertToNode.call(this, item, position, node);
                    return true;
                }

                // @ifdef DEBUG
                var entCountBefore = this.countItems();
                // @endif

                // else, split and try to push down the stuff we already have
                split.call(this, node);
                pushItemsToChildren.call(this, node);

                // @ifdef DEBUG
                var entCountAfter = this.countItems();
                if (entCountAfter !== entCountBefore) {
                    throw "Entity lost in QuadTree during split.";
                }
                // @endif
            }

            // try to add children
            var addedToChildren = node.children.some(function (child) {
                if (insertRecur.call(this, item, position, child)) {
                    return true;
                }
                return false;
            }, this);
            if (addedToChildren) {
                return true;
            }
            // couldn't add to children, so add to this
            insertToNode.call(this, item, position, node);
            return true;
        }

        // item doesn't fit
        return false;
    }

    function split(node) {
        // @ifdef DEBUG
        if (node.children.length !== 0) {
            throw "Split attempted when child nodes already exist.";
        }
        // @endif

        var scratch = physics.scratchpad();

        // TL TM --
        // ML MM MR
        // -- BM BR
        var TL = scratch.vector().set(node.position.x - node.position.hw, node.position.y - node.position.hh);
        var TM = scratch.vector().set(node.position.x, node.position.y - node.position.hh);
        var ML = scratch.vector().set(node.position.x - node.position.hw, node.position.y);
        var MM = scratch.vector().set(node.position.x, node.position.y);
        var MR = scratch.vector().set(node.position.x + node.position.hw, node.position.y);
        var BM = scratch.vector().set(node.position.x, node.position.y + node.position.hh);
        var BR = scratch.vector().set(node.position.x + node.position.hw, node.position.y + node.position.hh);

        [
            new QuadTreeNode(new physics.aabb(TL, MM)),
            new QuadTreeNode(new physics.aabb(TM, MR)),
            new QuadTreeNode(new physics.aabb(ML, BM)),
            new QuadTreeNode(new physics.aabb(MM, BR))
        ].forEach(function (newNode) {
            newNode.parent = node;
            node.children.push(newNode);
        });
        scratch.done();
    }

    function pushItemsToChildren(node) {
        // jshint validthis: true
        node.items.slice().forEach(function (item) {
            pushItemDown.call(this, item);
        }, this);
    }

    function pushItemDown(item) {
        // jshint validthis: true
        // @ifdef DEBUG
        if (item === null || item === undefined) {
            throw "Item must be set.";
        }
        // @endif
        this.itemDataMap[item].node.remove(item);
        var ret = insertRecur.call(this, item, this.itemDataMap[item].position, this.itemDataMap[item].node);
        // @ifdef DEBUG
        if (!ret) {
            throw "Item push down must succeed in this scenario.";
        }
        // @endif
        return ret;
    }

    function pullItemUp(item) {
        // jshint validthis: true
        // @ifdef DEBUG
        if (item === null || item === undefined) {
            throw "Item must be set.";
        }
        // @endif
        this.itemDataMap[item].node.remove(item);
        var position = this.itemDataMap[item].position;

        var upperNode = this.itemDataMap[item].node.parent;
        for(;;) {
            // @ifdef DEBUG
            if (!upperNode) {
                throw "upperNode must be set.";
            }
            // @endif
            if (this.positionContains(upperNode.position, position)) {
                var success = insertExplicit.call(this, item, position, upperNode);
                // @ifdef DEBUG
                if (!success) {
                    throw "insertExplicit must succeed in this scenario.";
                }
                // @endif
                break;
            }
            upperNode = upperNode.parent;
        }
    }

    function tryCollapseChildNodes(node) {
        // jshint validthis: true
        node.children.forEach(function (child) {
            child.items.slice().forEach(function (item) {
                pullItemUp.call(this, item);
            }, this);
        }, this);

        if (node.isEmptyRecursive()) {
            while (node.children.length > 0) {
                node.children.pop();
            }
            return true;
        }
        return false;
    }

    function QuadTreeNode(position) {
        if (!position) {
            throw "QuadTreeNode requires position to initialize.";
        }

        this.parent = null;
        this.position = position;
        this.children = [];
        this.items = [];
    }

    QuadTreeNode.prototype.isRootNode = function isRootNode() {
        return this.parent === null;
    };

    QuadTreeNode.prototype.isLeafNode = function isLeafNode() {
        return this.children.length === 0;
    };

    QuadTreeNode.prototype.isEmptyRecursive = function isEmptyRecursive() {
        if (this.items.length === 0 && this.isLeafNode()) {
            return true;
        }
        if (this.items.length === 0 && this.children.every(function (child) {
            return child.isEmptyRecursive();
        })) {
            return true;
        }
        return false;
    };

    QuadTreeNode.prototype.insert = function insert(item) {
        this.items.push(item);
    };

    QuadTreeNode.prototype.remove = function remove(item) {
        var index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    };

    QuadTreeNode.prototype.removeAll = function removeAll() {
        while (this.items.length > 0) {
            this.items.pop();
        }
    };
}

module.exports = {
    extend: extend
};
