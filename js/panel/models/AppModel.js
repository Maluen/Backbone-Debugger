define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

	var AppModel = AppComponent.extend({

        category: "Model",

		defaults: {
			"component_index": null, // intero
            "component_attributes": null, // hash <attributeName, attributeValue>
            "component_id": null,
            "component_cid": null,
            "component_url": null, // stringa
            "component_collectionIndex": null // intero
		},

		fetchLogic: function(onComplete) {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appModelInfo = this.getAppComponentInfoByIndex("Model", componentIndex);
                var componentCollectionInfo = this.getAppComponentInfo(appModelInfo.component.collection);

                // recupera gli attributi, sostituendo gli oggetti con un placeholder ({} o [])
                // (il vero valore può essere stampato sulla console
                // tramite l'apposito metodo, in questo modo si evitano problemi di serializzazione
                // con gli oggetti circolari)
                var appModelAttributes = {};
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
                        appModelAttributes[attributeName] = attributeValue;
                    }
                }
                if (_.isEmpty(appModelAttributes)) {
                    appModelAttributes = null;
                }

                var appModelUrl;
                try {
                    // se l'url non può essere generato solleva un eccezione
                    appModelUrl = appModelInfo.component.url();
                } catch (exception) {
                    appModelUrl = null;
                }
                var componentName =
                    appModelInfo.component.constructor.name +
                    " " +
                    (appModelInfo.component.attributes.name ||
                     appModelInfo.component.attributes.title ||
                     appModelInfo.index
                    );

                var appModelInfo = {
                    "component_name": componentName,
                    "component_index": appModelInfo.index,
                    "component_attributes": appModelAttributes,
                    "component_id": appModelInfo.component.id,
                    "component_cid": appModelInfo.component.cid,
                    "component_url": appModelUrl,
                    "component_collectionIndex": componentCollectionInfo? componentCollectionInfo.index : null
                };
                return appModelInfo;
            }, [this.get("component_index")], onComplete);
		},

        // stampa il valore dell'attributo nella console
        printAttribute: function(attributeName) {
            backboneAgentClient.execFunction(function(componentIndex, attributeName) {
                var appModelInfo = this.getAppComponentInfoByIndex("Model", componentIndex);
                var attributeValue = appModelInfo.component.attributes[attributeName];
                console.log(attributeValue);
            }, [this.get("component_index"), attributeName], _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }
    });
    return AppModel;
});