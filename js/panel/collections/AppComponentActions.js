/* This collection is sorted in reverse order (latest first) */

define(["backbone", "underscore", "backboneAgentClient",
        "collections/Collection", "models/AppComponentAction", "setImmediate"],
function(Backbone, _, backboneAgentClient, Collection, AppComponentAction, setImmediate) {

    var AppComponentActions = Collection.extend({

        component: undefined, // oggetto sottotipo di AppComponent
        model: AppComponentAction,

        initialize: function(models, options) {
            this.component = options.component;

            Collection.prototype.initialize.apply(this, arguments);
        },

        createModel: function(actionIndex) {
            var model = new this.model();
            model.component = this.component;
            model.index = actionIndex;
            return model;
        },

        // Define the sorting logic: reverse order
        comparator: function(action) {
            return -action.index;
        },

        loadModelsIndexes: function(onComplete) {
            // get the indexes of the app component actions
            backboneAgentClient.execFunction(function(start, length, componentCategory, componentIndex) {
                var appComponentInfo = this.appComponentsInfos[componentCategory].at(componentIndex);
                var appComponentActions = appComponentInfo.actions;

                // get length element or all if there are less
                var appComponentActionsIndexes = [];
                var left = appComponentActions.length - start;
                var end = left < length ? appComponentActions.length : start+length;
                for (var i=start; i<end; i++) {
                    appComponentActionsIndexes.push(i);
                }
                return appComponentActionsIndexes;
            }, [this.loadStartIndex, this.loadLength, this.component.category, this.component.index], onComplete);
        },

        startRealTimeUpdateLogic: function(onNew) {
            var reportName = "backboneAgent:"+this.component.category+":"
                           + this.component.index+":action";

            this.realTimeUpdateListener = [backboneAgentClient, reportName, _.bind(function(report) {
                onNew(report.componentActionIndex, report.timestamp);
            }, this)];

            this.listenTo.apply(this, this.realTimeUpdateListener);
        }

    });
    return AppComponentActions;
});
