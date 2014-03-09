/* Il prefisso "component_" negli attributi del modello serve ad evitare collisioni
   (sia l'app che il panel usano Backbone) */

define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppView = AppComponent.extend({

        category: "View",

        // attributi supportati dal modello
        defaults: {
            "component_index": null, // int
            "component_name": null, // string
            "component_modelIndex": null, // int
            "component_collectionIndex": null, // int
            "component_status": "Created" // can be "Created", "Rendered" or "Removed"
        },

        // Change the component status by analyzing its "Operation" actions.
        handleAction: function(action) {
            if (action.get("type") == "Operation") {
                var operationName = action.get("name");
                if (operationName == "render") {
                    this.set("component_status", "Rendered");
                } else if (operationName == "remove") {
                    this.set("component_status", "Removed");
                }
            }
        },

        // Estrae gli attributi dalle info recuperate dall'agent.
        fetchLogic: function(onComplete) {
            backboneAgentClient.execFunction(function(componentIndex, componentStatus) {
                var appViewInfo = this.getAppComponentInfoByIndex("View", componentIndex);
                var componentModelInfo = this.getAppComponentInfo(appViewInfo.component.model);
                var componentCollectionInfo = this.getAppComponentInfo(appViewInfo.component.collection);

                var appViewComponent = appViewInfo.component;
                var appViewSelector = "";
                if (typeof appViewComponent.el == 'object' && appViewComponent.el !== null) {
                    if (typeof appViewComponent.el.tagName == 'string' && appViewComponent.el.tagName !== "") {
                        appViewSelector += appViewComponent.el.tagName.toLowerCase();
                    }
                    if (typeof appViewComponent.el.id == 'string' && appViewComponent.el.id !== "") {
                        appViewSelector += "#"+appViewComponent.el.id;
                    }
                    if (typeof appViewComponent.el.className == 'string' && appViewComponent.el.className !== "") {
                        appViewSelector += "."+appViewComponent.el.className.replace(/ /g, '.');
                    }
                }
                var componentName = appViewComponent.constructor.name || null;
                var componentNameDetails = appViewSelector || null;
                if (componentName && componentNameDetails) {
                    componentName += " - " + componentNameDetails;
                } else {
                    componentName = componentName || componentNameDetails;
                }

                var appViewAttributes = {
                    "component_index": appViewInfo.index,
                    "component_name": componentName,
                    "component_modelIndex": componentModelInfo? componentModelInfo.index : null,
                    "component_collectionIndex": componentCollectionInfo? componentCollectionInfo.index : null,
                    "component_status": componentStatus
                };
                return appViewAttributes;
            }, [this.get("component_index"), this.get("component_status")], onComplete);
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
