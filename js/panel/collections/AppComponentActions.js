/* This collection is sorted in reverse order (latest first) */

define(["backbone", "underscore", "backboneAgentClient", "inspectedPageClient",
        "collections/Collection", "models/AppComponentAction", "setImmediate"],
function(Backbone, _, backboneAgentClient, inspectedPageClient, Collection, AppComponentAction, setImmediate) {

    var AppComponentActions = Collection.extend({

        component: undefined, // oggetto sottotipo di AppComponent
        model: AppComponentAction,

        initialize: function(models, options) {
            this.component = options.component;

            Collection.prototype.initialize.apply(this, arguments);
        },

        createModel: function(actionIndex) {
            var model = new this.model({
                "index": actionIndex
            });
            model.component = this.component;
            return model;
        },

        // Define the sorting logic: reverse order
        comparator: function(action) {
            return -action.get("index");
        },

        loadModelsIndexes: function(onComplete) {
            backboneAgentClient.execFunction(function(start, length, componentCategory, componentIndex) {
                var appComponentInfo = this.getAppComponentInfoByIndex(componentCategory, componentIndex);
                var appComponentActions = appComponentInfo.actions;
                var appComponentActionsIndexes = [];

                // get length element or all if there are less
                var left = appComponentActions.length - start;
                var end = left < length ? appComponentActions.length : start+length;
                for (var i=start; i<end; i++) {
                    appComponentActionsIndexes.push(i);
                }
                return appComponentActionsIndexes;
            }, [this.loadStartIndex, this.loadLength, this.component.category, this.component.get("component_index")], onComplete);
        },

        startRealTimeUpdateLogic: function(onNew) {
            var reportName = "backboneAgent:"+this.component.category+":"
                           + this.component.get("component_index")+":action";

            this.realTimeUpdateListener = [inspectedPageClient, reportName, _.bind(function(report) {
                onNew(report.componentActionIndex, report.timestamp);
            }, this)];

            this.listenTo.apply(this, this.realTimeUpdateListener);
        }

    });
    return AppComponentActions;
});
