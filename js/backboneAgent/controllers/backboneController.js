Modules.set('controllers.backboneController', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');
    var hidden = Modules.get('hidden');

    var backboneController = new (Component.extend({ // singleton

        initialize: function() {
            // function to call every time a new Backbone is detected
            this.callback = undefined;
        },

        // Calls the callback passing to it the Backbone object every time it's detected.
        // The function uses multiple methods of detection.
        onBackboneDetected: function(callback) {
            this.callback = callback;

            // global
            u.onSetted(window, "Backbone", u.bind(function(Backbone) {
                if (u.isObject(Backbone)) this.handleBackbone(Backbone);
            }, this));

            // AMD
            var me = this;
            u.patchFunctionLater(window, "define", function(originalFunction) { return function() {
                // function arguments: (id? : String, dependencies? : Array, factory : Function)

                // make arguments editable
                var argumentsArray = Array.prototype.slice.call(arguments);
                // find the factory function to patch it
                for (var i=0,l=argumentsArray.length; i<l; i++) {
                    if (typeof argumentsArray[i] == "function") {
                        // factory function found, patch it.
                        // NOTE: the patcher function must preserve the original arity,
                        // since it is used by loaders (RequireJS), in case of a module
                        // with no explicit dependencies, to understand when to pass them anyway
                        // (e.g. by finding the require calls in the factory body).
                        u.patchFunction(argumentsArray, i, function(originalFunction) { return function() {
                            var module = originalFunction.apply(this, arguments);

                            // check if Backbone has been defined by the factory fuction
                            // (some factories set "this" to Backbone)
                            var BackboneCandidate = module || this;
                            var isBackbone = u.isObject(BackboneCandidate) &&
                                             typeof BackboneCandidate.View == "function" &&
                                             typeof BackboneCandidate.Model == "function" &&
                                             typeof BackboneCandidate.Collection == "function" &&
                                             typeof BackboneCandidate.Router == "function";
                            if (isBackbone) {
                                me.handleBackbone(BackboneCandidate);
                            }

                            return module;
                        }}, { preserveArity: true });

                        break;
                    }
                }
                return originalFunction.apply(this, argumentsArray);
            }});
        },

        handleBackbone: function(Backbone) {
            // skip if already detected
            // (needed because the app could define Backbone in multiple ways at once)
            if (hidden.get(Backbone, "isDetected")) return;
            hidden.set(Backbone, "isDetected", true);

            this.trigger('backboneDetected', Backbone);
            this.callback(Backbone);
        }

    }))();

    return backboneController;
});
