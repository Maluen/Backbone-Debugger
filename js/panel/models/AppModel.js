define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppModel = AppComponent.extend({

        category: "Model",

        defaults: {
            "component_index": null, // int
            "component_name": null, // string
            "component_attributes": null, // hash <attributeName, attributeValue>
            "component_id": null,
            "component_cid": null,
            "component_url": null, // string
            "component_collectionIndex": null, // int
            "component_status": "instantiated" // last sync status, e.g. "read (success)"
        },

        // Change the component status by analyzing its "Sync" actions.
        handleAction: function(action) {
            if (action.get("type") == "Sync") {
                var syncStatus = action.get("name");
                this.set("component_status", syncStatus);
            }
        },

        fetchLogic: function(onComplete) {
            backboneAgentClient.execFunction(function(componentIndex, componentStatus) {
                var appModelInfo = this.getAppComponentInfoByIndex("Model", componentIndex);
                var componentCollectionInfo = this.getAppComponentInfo(appModelInfo.component.collection);

                // recupera gli attributi, sostituendo gli oggetti con un placeholder ({} o [])
                // (il vero valore può essere stampato sulla console
                // tramite l'apposito metodo, in questo modo si evitano problemi di serializzazione
                // con gli oggetti circolari)
                var componentAttributes = {};
                var numAttributes = 0;
                var realAttributes = appModelInfo.component.attributes;
                for (var attributeName in realAttributes) {
                    if (realAttributes.hasOwnProperty(attributeName)) {
                        var attributeValue = realAttributes[attributeName];
                        if (typeof attributeValue == "object" && attributeValue !== null) {
                            // placeholder
                            if (Object.prototype.toString.call(attributeValue) === '[object Array]') {
                                attributeValue = [];
                            } else {
                                attributeValue = {};
                            }
                        }
                        componentAttributes[attributeName] = attributeValue;
                        numAttributes++;
                    }
                }
                if (numAttributes === 0) {
                    componentAttributes = null;
                }

                var appModelUrl;
                try {
                    // se l'url non può essere generato solleva un eccezione
                    appModelUrl = appModelInfo.component.url();
                } catch (exception) {
                    appModelUrl = null;
                }

                // e.g. "MyModel - modelTitle" or "MyModel" or modelTitle"
                var componentName = appModelInfo.component.constructor.name || null;
                var componentNameDetails = appModelInfo.component.attributes['name'] ||
                                           appModelInfo.component.attributes['title'] || null;
                if (componentName && componentNameDetails) {
                    componentName += " - " + componentNameDetails;
                } else {
                    componentName = componentName || componentNameDetails;
                }

                var appModelAttributes = {
                    "component_index": appModelInfo.index,
                    "component_name": componentName,
                    "component_attributes": componentAttributes,
                    "component_id": appModelInfo.component.id,
                    "component_cid": appModelInfo.component.cid,
                    "component_url": appModelUrl,
                    "component_collectionIndex": componentCollectionInfo? componentCollectionInfo.index : null,
                    "component_status": componentStatus
                };
                return appModelAttributes;
            }, [this.get("component_index"), this.get("component_status")], onComplete);
        },

        // stampa il valore dell'attributo nella console
        printAttribute: function(attributeName) {
            backboneAgentClient.execFunction(function(componentIndex, attributeName) {
                var appModelInfo = this.getAppComponentInfoByIndex("Model", componentIndex);
                var attributeValue = appModelInfo.component.attributes[attributeName];
                console.log(attributeName+":", attributeValue);
            }, [this.get("component_index"), attributeName], _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }
    });
    return AppModel;
});
