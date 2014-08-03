define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppModel = AppComponent.extend({

        category: "Model",

        // see backbone agent for supported attributes

        // stampa il valore dell'attributo nella console
        printAttribute: function(attributeName) {
            backboneAgentClient.execFunction(function(componentIndex, attributeName) {
                var appModelInfo = this.getAppComponentInfoByIndex("Model", componentIndex);
                var attributeValue = appModelInfo.component.attributes[attributeName];
                console.log(attributeName+":", attributeValue);
            }, [this.index, attributeName], _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }

    });
    return AppModel;
});
