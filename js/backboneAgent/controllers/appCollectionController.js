Modules.set('controllers.appCollectionController', function() {
    // imports
    var AppDataComponentController = Modules.get('controllers.AppDataComponentController');
    var u = Modules.get('utils');
    var appCollectionsInfo = Modules.get('collections.appCollectionsInfo');
    var appModelsInfo = Modules.get('collections.appModelsInfo');

    var appCollectionController = new (AppDataComponentController.extend({ // singleton

        handle: function(collection) {
            // on new instance

            var me = this;

            var collectionInfo = appCollectionsInfo.register(collection, {
                "component_name": null, // string
                "component_hasModel": null, // bool, true if the collection has the model property setted
                                            // (with the type of the models)
                "component_models": null, // array with the indexes of the models contained in the collection
                "component_url": null, // string
                "component_status": null // last sync status, e.g. "read (success)"
            });

            // based on the constructor and on the url
            var updateCollectionName = function() {
                var componentName = collectionInfo.component.constructor.name ||
                                    collectionInfo.attributes["component_url"] || null;
                collectionInfo.set("component_name", componentName);
            }

            // initial attributes
            updateCollectionName(); // is based also on the constructor!

            // monitor app component properties to update attributes

            u.monitorProperty(collection, "model", 0, function() {
                var hasModel = collectionInfo.component.model !== undefined;
                collectionInfo.set("component_hasModel", hasModel);
            });

            u.monitorProperty(collection, "models", 1, function() {
                var models = collectionInfo.component.models;
                var modelsIndexes = [];
                for (var i=0,l=models.length; i<l; i++) {
                    var model = models[i];
                    var modelIndex = appModelsInfo.getByComponent(model).index;
                    modelsIndexes.push(modelIndex);
                }
                collectionInfo.set("component_models", modelsIndexes);
            });

            u.monitorProperty(collection, "url", 0, function() {
                var url = collectionInfo.component.url;
                if (typeof url === "function") {
                    // the url can be specified also as a function that returns it
                    try {
                        // if the url can't be generated, the method couuld raise an exception (user defined)
                        url = url();
                    } catch (exception) {
                        url = null;
                    }
                }
                collectionInfo.set("component_url", url);

                // the url is used also to generate the name!
                updateCollectionName();
            });

            // Patch the app component methods

            this.patchTrigger(collectionInfo);
            this.patchEvents(collectionInfo);
            this.patchSync(collectionInfo);
        }

    }))();

    return appCollectionController;
});