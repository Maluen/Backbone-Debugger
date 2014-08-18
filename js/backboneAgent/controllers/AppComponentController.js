Modules.set('controllers.AppComponentController', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');

    var AppComponentController = Component.extend({

        // Patch the trigger method of the app component
        patchTrigger: function(appComponentInfo) {
            u.patchFunctionLater(appComponentInfo.component, "trigger", function(originalFunction) { return function() {
                var result = originalFunction.apply(this, arguments);

                // function signature: trigger(eventName, arg1, arg2, ...) 
                var eventName = arguments[0];
                var eventArguments = undefined;
                if (arguments.length > 1) { // the event has arguments
                    // get the event arguments by skipping the first function argument (i.e the event name)
                    eventArguments = Array.prototype.slice.call(arguments, 1);
                }
                // save data only if there is
                var data = eventArguments;
                var dataKind = (data === undefined) ? undefined : "event arguments";

                appComponentInfo.actions.register({
                    "type": "Trigger",
                    "name": eventName,
                    "dataKind": dataKind
                }, data);

                return result;
            };});
        },

        // Patch the _events property of the app component
        // (contains the handlers for the Backbone events)
        patchEvents: function(appComponentInfo) {
            // TODO: function to remove?
        }

    });

    return AppComponentController;
});