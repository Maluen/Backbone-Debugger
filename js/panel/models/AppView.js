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
            }, [this.index]);
        },

        inspectElement: function() {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appViewInfo = this.appComponentsInfos['View'].at(componentIndex);

                var appView = appViewInfo.component;
                var element = appView.$el ? appView.$el[0] : appView.el;
                inspect(element);
            }, [this.index]);
        },

        highlightElement: function() {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appViewInfo = this.appComponentsInfos['View'].at(componentIndex);
                this.appComponentControllers['View'].highlightViewElement(appViewInfo.component);
            }, [this.index]);
        }

    });
    return AppView;
});
