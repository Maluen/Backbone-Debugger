define(["backbone", "underscore", "backboneAgentClient"],
function(Backbone, _, backboneAgentClient) {
    
    var AppComponentAction = Backbone.Model.extend({

        component: undefined, // oggetto sottotipo di AppComponent

        // attributi supportati dal modello
        defaults: {
            "index": null,
            "timestamp": null, // numero
            "type": null, // stringa
            "name": null, // stringa
            "targetKind": null, // può essere "AppComponent", "jQuery Event" o "Other"
            // i seguenti attributi saranno settati solo se il target è un componente dell'app
            // (cioè targetKind è impostato a "AppComponent")
            "targetAppComponentCategory": null, // stringa
            "targetAppComponentIndex": null
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
                // targetInfo è valido se il target è un componente
                var targetInfo = this.getAppComponentInfo(appComponentAction.target);


                var appComponentActionAttributes = {
                    "index": index,
                    "timestamp": appComponentAction.timestamp,
                    "type": appComponentAction.type,
                    "name": appComponentAction.name,
                    "targetKind": appComponentAction.targetKind,
                    "targetAppComponentCategory": targetInfo? targetInfo.category : null,
                    "targetAppComponentIndex": targetInfo? targetInfo.index : null,
                };
                return appComponentActionAttributes;
            }, [this.component.category, this.component.get("component_index"), index], 
            _.bind(function(appComponentActionAttributes) { // on executed
                // resetta gli attributi
                this.clear({silent: true});
                this.set(appComponentActionAttributes);

                if (onComplete !== undefined) onComplete();
            }, this));
        },

        // stampa il target sulla console
        printTarget: function() {
            backboneAgentClient.execFunction(function(componentCategory, componentIndex, index) {
                var appComponentInfo = this.getAppComponentInfoByIndex(componentCategory, componentIndex);
                var appComponentAction = appComponentInfo.actions[index];
                console.log(appComponentAction.target);
            }, [this.component.category, this.component.get("component_index"), this.get("index")], 
            _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }
    });
    return AppComponentAction;
});