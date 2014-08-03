define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppCollection = AppComponent.extend({

        category: "Collection"

        // see backbone agent for supported attributes

    });
    return AppCollection;
});
