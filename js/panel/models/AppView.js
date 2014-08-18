/* Il prefisso "component_" negli attributi del modello serve ad evitare collisioni
   (sia l'app che il panel usano Backbone) */

define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppView = AppComponent.extend({

        category: "View",

        // see backbone agent for supported attributes

        // stampa l'elemento html della vista sulla console
        printElement: function() {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appViewInfo = this.appComponentsInfos['View'].at(componentIndex);
                var appViewEl = appViewInfo.component.el;
                console.log(appViewEl);
            }, [this.index], _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }

    });
    return AppView;
});
