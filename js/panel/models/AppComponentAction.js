define(["backbone", "underscore", "backboneAgentClient", "setImmediate"],
function(Backbone, _, backboneAgentClient, setImmediate) {

    var AppComponentAction = Backbone.Model.extend({

        component: undefined, // AppComponent child object

        // index of the action (relative to those of the component)
        index: undefined,

        // see backbone agent for supported attributes

        initialize: function(attributes, options) {
            _.bindAll(this);
        },

        fetch: function(onComplete) {
            var index = this.index;
            if (index === undefined) {
                throw "The index attribute is undefined.";
            }

            backboneAgentClient.execFunction(function(componentCategory, componentIndex, index) {
                var appComponentInfo = this.appComponentsInfos[componentCategory].at(componentIndex);
                var appComponentAction = appComponentInfo.actions.at(index);
                return appComponentAction.attributes;
            }, [this.component.category, this.component.index, this.index],
            _.bind(function(appComponentActionAttributes) { // on executed
                setImmediate(_.bind(function() { // prevent UI blocking
                    // reset attributes
                    this.clear({silent: true});
                    this.set(appComponentActionAttributes);

                    if (onComplete !== undefined) onComplete();
                }, this));
            }, this));
        },

        // print the action data on the console
        printData: function() {
            backboneAgentClient.execFunction(function(componentCategory, componentIndex, index) {
                var appComponentInfo = this.appComponentsInfos[componentCategory].at(componentIndex);
                var appComponentAction = appComponentInfo.actions.at(index);
                console.log(appComponentAction.get('name')+":", appComponentAction.data);
            }, [this.component.category, this.component.index, this.index],
            _.bind(function(result) { // on executed
                // do nothing
            }, this));
        }
        
    });
    return AppComponentAction;
});
