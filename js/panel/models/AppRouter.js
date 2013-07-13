define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppRouter = AppComponent.extend({

        category: "Router",

        // attributi supportati dal modello
        defaults: {
            "component_index": null, // int
            "component_name": null // string
        },

        fetchLogic: function(onComplete) {
            backboneAgentClient.execFunction(function(componentIndex) {
                var appRouterInfo = this.getAppComponentInfoByIndex("Router", componentIndex);
                
                var componentName = appRouterInfo.component.constructor.name || null;

                var appRouterAttributes = {
                    "component_index": appRouterInfo.index,
                    "component_name": componentName
                };
                return appRouterAttributes;
            }, [this.get("component_index")], onComplete);
        }
    });
    return AppRouter;
});
