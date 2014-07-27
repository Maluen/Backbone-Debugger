/* Collezione di componenti dell'applicazione di una data categoria. 
   E' il tipo padre di tutte le altre collezioni di componenti (di viste, modelli, etc.) */

define(["backbone", "underscore", "backboneAgentClient", "inspectedPageClient",
        "collections/Collection", "collections/AppComponentActions"],
function(Backbone, _, backboneAgentClient, inspectedPageClient, Collection, AppComponentActions) {

    var AppComponents = Collection.extend({

        componentCategory: undefined, // categoria dei componenti (es. "View", "Model", etc.)

        createModel: function(componentIndex) {
            var model = new this.model({
                "component_index": componentIndex
            });
            return model;
        },

        loadModelsIndexes: function(onComplete) {
            backboneAgentClient.execFunction(function(start, length, componentCategory) {
                // gets the indexes of the app components
                return this.getAppComponentsIndexes(componentCategory).slice(start, start+length);
            }, [this.loadStartIndex, this.loadLength, this.componentCategory], onComplete);
        },

        startRealTimeUpdateLogic: function(onNew) {
            var reportName = "backboneAgent:"+this.componentCategory+":new";
            
            this.realTimeUpdateListener = [inspectedPageClient, reportName, _.bind(function(report) {
                onNew(report.componentIndex, report.timestamp);
            }, this)];

            this.listenTo.apply(this, this.realTimeUpdateListener);
        }
    });
    return AppComponents;
});
