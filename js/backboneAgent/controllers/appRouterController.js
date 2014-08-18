Modules.set('controllers.appRouterController', function() {
    // imports
    var AppComponentController = Modules.get('controllers.AppComponentController');
    var appRoutersInfo = Modules.get('collections.appRoutersInfo');

    var appRouterController = new (AppComponentController.extend({ // singleton

        handle: function(router) {
            // on new instance

            var me = this;

            var routerInfo = appRoutersInfo.register(router, {
                "component_name": null // string
            });

            // based on the constructor
            var updateRouterName = function() {
                var componentName = routerInfo.component.constructor.name || null;
                routerInfo.set("component_name", componentName);
            }

            // initial attributes
            updateRouterName(); // is based also on the constructor!

            // Patch the app component methods

            this.patchTrigger(routerInfo);
            this.patchEvents(routerInfo);
        }

    }))();

    return appRouterController;
});