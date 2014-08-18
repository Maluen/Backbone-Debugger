// Collection of AppComponentAction for a specific AppComponentInfo.
Modules.set('collections.AppComponentActions', function() {
    // imports
    var Collection = Modules.get('collections.Collection');
    var AppComponentAction = Modules.get('models.AppComponentAction');

    var AppComponentActions = Collection.extend({

        // AppComponentInfo this actions belong to
        appComponentInfo: undefined,

        // Note: assumes models is empty.
        initialize: function(models, options) {
            this.appComponentInfo = options.appComponentInfo;
        },

        // Register a new app component action, by creating its model and by adding it to the collection.
        // Return the model.
        register: function(actionAttributes, actionData) {

            var actionIndex = this.length;

            var appComponentAction = new AppComponentAction(actionAttributes, {
                appComponentInfo: this.appComponentInfo,
                index: actionIndex,
                data: actionData
            });

            this.add(appComponentAction);

            return appComponentAction;
        }

    });

    return AppComponentActions;
});