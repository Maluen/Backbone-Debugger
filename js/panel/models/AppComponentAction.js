define(["backbone", "underscore", "backboneAgentClient", "setImmediate"],
function(Backbone, _, backboneAgentClient, setImmediate) {

    var AppComponentAction = Backbone.Model.extend({

        component: undefined, // oggetto sottotipo di AppComponent

        // attributi supportati dal modello
        defaults: {
            "index": null,
            "timestamp": null, // numero
            "type": null, // stringa
            "name": null, // stringa
            "dataKind": null // string, see AppComponentAction dataKind definition 
                             // in backboneAgent for possible values
        },

        initialize: function(attributes, options) {
            _.bindAll(this);
        },

        fetch: function(onComplete) {
            var index = this.get("index");
            if (index === undefined) {
                throw "The index attribute is undefined.";
            }

            backboneAgentClient.execFunction(function(componentCategory, componentIndex, index) {
                var appComponentInfo = this.getAppComponentInfoByIndex(componentCategory, componentIndex);
                var appComponentAction = appComponentInfo.actions[index];

                var appComponentActionAttributes = {
                    "index": index,
                    "timestamp": appComponentAction.timestamp,
                    "type": appComponentAction.type,
                    "name": appComponentAction.name,
                    "dataKind": appComponentAction.dataKind
                };
                return appComponentActionAttributes;
            }, [this.component.category, this.component.get("component_index"), index],
            _.bind(function(appComponentActionAttributes) { // on executed
                setImmediate(_.bind(function() { // prevent UI blocking
                    // resetta gli attributi
                    this.clear({silent: true});
                    this.set(appComponentActionAttributes);

                    if (onComplete !== undefined) onComplete();
                }, this));
            }, this));
        },

        // stampa l'action data sulla console
        printData: function() {
            backboneAgentClient.execFunction(function(componentCategory, componentIndex, index) {
                var appComponentInfo = this.getAppComponentInfoByIndex(componentCategory, componentIndex);
                var appComponentAction = appComponentInfo.actions[index];
                console.log(appComponentAction.name+":", appComponentAction.data);
            }, [this.component.category, this.component.get("component_index"), this.get("index")],
            _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }
    });
    return AppComponentAction;
});
