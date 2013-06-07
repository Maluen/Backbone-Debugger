/* Il prefisso "component_" negli attributi del modello serve ad evitare collisioni
   (sia l'app che il panel usano Backbone) */

define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

	var AppView = AppComponent.extend({

        category: "View",

		// attributi supportati dal modello
		defaults: {
			"component_index": null, // intero
			"component_modelIndex": null, // intero
			"component_collectionIndex": null // intero
		},

		// Estrae gli attributi dalle info recuperate dall'agent.
		fetchLogic: function(onComplete) {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appViewInfo = this.getAppComponentInfoByIndex("View", componentIndex);
                var componentModelInfo = this.getAppComponentInfo(appViewInfo.component.model);
                var componentCollectionInfo = this.getAppComponentInfo(appViewInfo.component.collection);
                var componentName =
                    appViewInfo.component.constructor.name ||
                    appViewInfo.component.__proto__.constructor.name;
                var appViewAttributes = {
                    "component_name": componentName,
                    "component_index": appViewInfo.index,
                    "component_modelIndex": componentModelInfo? componentModelInfo.index : null,
                    "component_collectionIndex": componentCollectionInfo? componentCollectionInfo.index : null
                };
                return appViewAttributes;
            }, [this.get("component_index")], onComplete);
		},

        // stampa l'elemento html della vista sulla console
        printElement: function() {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appViewInfo = this.getAppComponentInfoByIndex("View", componentIndex);
                var appViewEl = appViewInfo.component.el;
                console.log(appViewEl);
            }, [this.get("component_index")], _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }
    });
    return AppView;
});