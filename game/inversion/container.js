"use strict";

var dependencies = {};
var singletons = {};
var loadTypes = {
    instantiate: 0,
    singleton: 1,
    return: 2
};

function resolve (name) {
    var item = dependencies[name];
    if  (item) {
        if (item.loadType === loadTypes.singleton && singletons[name]) {
            return singletons[name];
        } else if (item.loadType === loadTypes.return) {
            return item.value;
        }

        var depList = item.value.$inject;
        var deps = [];
        if (depList) {
            deps = findDependencies(depList).map(function (dep, i) {
                return resolve(depList[i]);
            });
        }
        if (arguments.length > 1) {
            deps = deps.concat(Array.prototype.slice.call(arguments, 1));
        }

        if (item.loadType === loadTypes.instantiate) {
            deps.unshift(item.value);
            return new (Function.prototype.bind.apply(item.value, deps))();
        }
        
        if (item.loadType === loadTypes.singleton) {
            if (!singletons[name]) {
                if (item.args) {
                    item.args.forEach(function (arg) {
                        deps.push(arg);
                    });
                }
                deps.unshift(item.value);
                singletons[name] = new (Function.prototype.bind.apply(item.value, deps))();
            }
            return singletons[name];
        }
    }
}

function findDependencies(dependencyList) {
    return dependencyList.map(function (value) {
        if (!dependencies.hasOwnProperty(value)) {
            console.log('Failed to resolve dependency ' + value);
        }
        return dependencies[value];
    });
}

function registerType(name, locator) {
    dependencies[name] = {
        value: locator,
        loadType: loadTypes.instantiate
    };
}

function registerInstance(name, locator, args) {
    dependencies[name] = {
        value: locator,
        loadType: loadTypes.singleton,
        args: args
    };
}

function registerAlias(name, locator) {
    dependencies[name] = {
        value: locator,
        loadType: loadTypes.return
    };
}

module.exports = {
    resolve: resolve,
    registerType: registerType,
    registerInstance: registerInstance,
    registerAlias: registerAlias
};
