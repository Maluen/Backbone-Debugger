// base controller for app models & collections

Modules.set('controllers.AppDataComponentController', function() {
    // imports
    var AppComponentController = Modules.get('controllers.AppComponentController');
    var u = Modules.get('utils');

    var AppDataComponentController = AppComponentController.extend({

        // Patch the sync method of the app component (for models and collections).
        patchSync: function(appComponentInfo) {
            u.patchFunctionLater(appComponentInfo.component, "sync", function(originalFunction) { return function() {

                var method = arguments[0]; // e.g. "create", "read", etc.

                var syncCompleted = function(isSuccess) {
                    var syncStatus = isSuccess? "success" : "failure";
                    var actionName = method + " ("+syncStatus+")"; // e.g. "fetch (failure)"

                    appComponentInfo.set("component_status", actionName);

                    appComponentInfo.actions.register({
                        "type": "Sync", 
                        "name": actionName
                    });
                };

                // arguments[2] is an hash with the sync options
                // it is changed on-the-fly so to keep track of the sync outcome
                var argumentsArray = Array.prototype.slice.call(arguments);
                if (argumentsArray[2] === undefined) { // check needed since options are, well... optional
                    argumentsArray[2] = {};
                }
                u.patchFunction(argumentsArray[2], "success", function(originalFunction) { return function() {
                    syncCompleted(true);
                    if (originalFunction) { // check needed since the success callback is optional
                        return originalFunction.apply(this, arguments);
                    }
                };});
                u.patchFunction(argumentsArray[2], "failure", function(originalFunction) { return function() {
                    syncCompleted(false);
                    if (originalFunction) { // check needed since the failure callback is optional
                        return originalFunction.apply(this, arguments);
                    }
                };});
                var result = originalFunction.apply(this, argumentsArray);
                return result;
            };});
        }

    });

    return AppDataComponentController;
});