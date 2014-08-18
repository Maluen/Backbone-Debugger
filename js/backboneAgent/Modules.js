// Simple module system with define (set) and require (get) capabilities.

var Modules = new (function() { // singleton object

    // hash <name, factory>
    var factories = {};

    // hash <name, module>, where module is the return value of the factory
    var modules = {};

    this.set = function(name, factory) {
        factories[name] = factory;
    };

    // return factory
    this.get = function(name) {
        var module = modules[name];
        if (!module) {
            module = modules[name] = factories[name]();
        }
        return module;
    };

})();