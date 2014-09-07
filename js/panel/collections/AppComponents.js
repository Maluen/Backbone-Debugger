/* Collezione di componenti dell'applicazione di una data categoria. 
   E' il tipo padre di tutte le altre collezioni di componenti (di viste, modelli, etc.) */

define(["backbone", "underscore", "backboneAgentClient",
        "collections/Collection", "collections/AppComponentActions"],
function(Backbone, _, backboneAgentClient, Collection, AppComponentActions) {

    var AppComponents = Collection.extend({

        componentCategory: undefined, // categoria dei componenti (es. "View", "Model", etc.)

        createModel: function(componentIndex) {
            var model = new this.model();
            model.index = componentIndex;
            return model;
        },

        loadModelsIndexes: function(onComplete) {
            // gets the indexes of the app components
            backboneAgentClient.execFunction(function(start, length, componentCategory) {
                var appComponentsInfo = this.appComponentsInfos[componentCategory];

                // get length element or all if there are less
                var appComponentIndexes = [];
                var left = appComponentsInfo.length - start;
                var end = left < length ? appComponentsInfo.length : start+length;
                for (var i=start; i<end; i++) {
                    appComponentIndexes.push(i);
                }
                return appComponentIndexes;
            }, [this.loadStartIndex, this.loadLength, this.componentCategory], onComplete);
        },

        startRealTimeUpdateLogic: function(onNew) {
            var reportName = "backboneAgent:"+this.componentCategory+":new";
            
            this.realTimeUpdateListener = [backboneAgentClient, reportName, _.bind(function(report) {
                onNew(report.componentIndex, report.timestamp);
            }, this)];

            this.listenTo.apply(this, this.realTimeUpdateListener);
        }
    });
    return AppComponents;
});
