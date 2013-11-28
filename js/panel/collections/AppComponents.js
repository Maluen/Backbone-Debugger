/* Collezione di componenti dell'applicazione di una data categoria. 
   E' il tipo padre di tutte le altre collezioni di componenti (di viste, modelli, etc.) 

   L'aggiornamento in tempo reale viene attivato automaticamente in fase di inizializzazione. */

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

        fetchModelsIndexes: function(onComplete) {
            backboneAgentClient.execFunction(function(componentCategory) {
                // ottiene gli indici dei componenti dell'app
                return this.getAppComponentsIndexes(componentCategory);
            }, [this.componentCategory], onComplete);
        },

        realTimeUpdateLogic: function(onNew) {
            var reportName = "backboneAgent:"+this.componentCategory+":new";
            this.listenTo(inspectedPageClient, reportName, _.bind(function(report) {
                onNew(report.componentIndex, report.timestamp);
            }, this));
        }
    });
    return AppComponents;
});
