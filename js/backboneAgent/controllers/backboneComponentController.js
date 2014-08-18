Modules.set('controllers.backboneComponentController', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');
    var hidden = Modules.get('hidden');

    var backboneComponentController = new (Component.extend({ // singleton

        // callback is called on each instantiation of the given Backbone Component
        // (and of its subtypes), passing to it the new instance.
        // The valid Backbone components are Backbone.View, Backbone.Model, 
        // Backbone.Collection and Backbone.Router.
        // Note: assumes that the Backbone component has been only initially setted.
        onNewInstance: function(BackboneComponent, callback) {

            u.onceDefined(BackboneComponent, "extend", function() {
                // (the extend is the last setted method, thus now the component is ready)

                // Patch the initialize of the component (ad of its subtypes) to intercept
                // the created instances; that means the mechanism won't work if subtypes
                // define custom constructors that don't call the initialize.

                var patchInitialize = function(originalInitialize) {
                    return function() {
                        // Patch the istances if not already done
                        // (e.g. if the instance calls the initialize of the parent, avoid
                        // to patch it twice)
                        var isInstancePatched = hidden.get(this, "isInstancePatched");
                        if (!isInstancePatched) {
                            callback(this);
                            hidden.set(this, "isInstancePatched", true);
                        }

                        if (typeof originalInitialize === "function") {
                            return originalInitialize.apply(this, arguments);
                        }
                    };
                };

                // the setter/getter for the initialize are changed so to patch on-the-fly eventual
                // overrides of the property from subtypes, and to return the patched property;
                // thus, the used extend methodology must keep those getter and setter in the created subtypes.

                // this property will be also inherited from subtypes and will end up in the various 
                // instances, it contains the patched version of the initialize.
                hidden.set(BackboneComponent.prototype, "patchedInitialize",
                                  patchInitialize(BackboneComponent.prototype.initialize));

                Object.defineProperty(BackboneComponent.prototype, "initialize", {
                    configurable: true,
                    enumerable: true,

                    get: function() {
                        var patchedInitialize = hidden.get(this, "patchedInitialize");
                        return patchedInitialize;
                    },

                    set: function(newInitialize) {
                        hidden.set(this, "patchedInitialize", patchInitialize(newInitialize));
                    }
                });
            });
        }

    }))();

    return backboneComponentController;
});