Modules.set('controllers.appModelController', function() {
    // imports
    var AppDataComponentController = Modules.get('controllers.AppDataComponentController');
    var u = Modules.get('utils');
    var appModelsInfo = Modules.get('collections.appModelsInfo');
    var appCollectionsInfo = Modules.get('collections.appCollectionsInfo');

    var appModelController = new (AppDataComponentController.extend({ // singleton

        handle: function(model) {
            // on new instance

            var me = this;
                
            var modelInfo = appModelsInfo.register(model, {
                "component_name": null, // string
                "component_attributes": null, // hash <attributeName, attributeValue>
                "component_id": null,
                "component_cid": null,
                "component_url": null, // string
                "component_collectionIndex": null, // int
                "component_status": null // last sync status, e.g. "read (success)"
            });

            // based on the constructor and on the attributes property
            var updateModelName = function() {
                // e.g. "MyModel - modelTitle" or "MyModel" or modelTitle"
                var componentName = modelInfo.component.constructor.name || null;
                var componentNameDetails = modelInfo.component.attributes['name'] ||
                                           modelInfo.component.attributes['title'] || null;
                if (componentName && componentNameDetails) {
                    componentName += " - " + componentNameDetails;
                } else {
                    componentName = componentName || componentNameDetails;
                }
                modelInfo.set("component_name", componentName);
            }

            // initial attributes
            updateModelName(); // is based also on the constructor!

            // monitor app component properties to update attributes

            u.monitorProperty(model, "attributes", 1, function() {
                // retrieves the model attributes (the backbone ones), replacing values which are objects
                // with {} or [] placeholders (based of if they are plain objects or arrays) 
                // (the real value can be printed in the console with the relative method, 
                // this way problems with serializing circular objects can be avoided)
                var attributes = {};
                var numAttributes = 0;
                var realAttributes = modelInfo.component.attributes;
                for (var attributeName in realAttributes) {
                    if (realAttributes.hasOwnProperty(attributeName)) {
                        var attributeValue = realAttributes[attributeName];
                        if (u.isObject(attributeValue)) {
                            // placeholder
                            if (u.isArray(attributeValue)) {
                                attributeValue = [];
                            } else {
                                attributeValue = {};
                            }
                        }
                        attributes[attributeName] = attributeValue;
                        numAttributes++;
                    }
                }
                if (numAttributes === 0) {
                    attributes = null;
                }
                modelInfo.set("component_attributes", attributes);

                // the attributes are also used in the component name!
                updateModelName();
            });

            u.monitorProperty(model, "id", 0, function() {
                modelInfo.set("component_id", modelInfo.component.id);
            });

            u.monitorProperty(model, "cid", 0, function() {
                modelInfo.set("component_cid", modelInfo.component.cid);
            });

            // based on the urlRoot and collection properties.
            var updateModelUrl = function() {
                var url;
                try {
                    // if the url can't be generated, the method will raise an exception
                    url = modelInfo.component.url();
                } catch (exception) {
                    url = null;
                }
                modelInfo.set("component_url", url);
            }

            u.monitorProperty(model, "urlRoot", 0, updateModelUrl);

            u.monitorProperty(model, "collection", 0, function() {
                var componentCollectionInfo = appCollectionsInfo.getByComponent(modelInfo.component.collection);
                var componentCollectionIndex = componentCollectionInfo? componentCollectionInfo.index : null;
                modelInfo.set("component_collectionIndex", componentCollectionIndex);

                // the collection is used also to generate the url!
                updateModelUrl();
            });

            // Patch the app component methods

            this.patchTrigger(modelInfo);
            this.patchEvents(modelInfo);
            this.patchSync(modelInfo);
        }

    }))();

    return appModelController;
});
