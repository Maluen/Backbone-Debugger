define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppModel = AppComponent.extend({

        category: "Model",

        // see backbone agent for supported attributes

        // print the model attribute value on the console
        printAttribute: function(attributeName) {
            backboneAgentClient.execFunction(function(componentIndex, attributeName) {
                var appModelInfo = this.appComponentsInfos['Model'].at(componentIndex);
                var attributeValue = appModelInfo.component.attributes[attributeName];
                console.log(attributeName+":", attributeValue);
            }, [this.index, attributeName], _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }

    });
    return AppModel;
});
