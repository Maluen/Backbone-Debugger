define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {
    
    var AppRouter = AppComponent.extend({

        category: "Router",

        // attributi supportati dal modello
        defaults: {
            "component_index": null, // intero
        },

        fetchLogic: function(onComplete) {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appRouterInfo = this.getAppComponentInfoByIndex("Router", componentIndex);

                var appRouterAttributes = {
                    "component_index": appRouterInfo.index,
                };
                return appRouterAttributes;
            }, [this.get("component_index")], onComplete);
        }
    });
    return AppRouter;
});