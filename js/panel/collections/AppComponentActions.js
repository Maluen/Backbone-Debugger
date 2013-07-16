define(["backbone", "underscore", "backboneAgentClient", "inspectedPageClient",
        "collections/Collection", "models/AppComponentAction"],
function(Backbone, _, backboneAgentClient, inspectedPageClient, Collection, AppComponentAction) {

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

        fetchModelsIndexes: function(onComplete) {
            backboneAgentClient.execFunction(function(componentCategory, componentIndex) {
                var appComponentInfo = this.getAppComponentInfoByIndex(componentCategory, componentIndex);
                var appComponentActions = appComponentInfo.actions;
                var appComponentActionsIndexes = [];
                for (var actionIndex in appComponentActions) {
                    if (appComponentActions.hasOwnProperty(actionIndex)) {
                        appComponentActionsIndexes.push(actionIndex);
                    }
                }
                return appComponentActionsIndexes;
            }, [this.component.category, this.component.get("component_index")], onComplete);
        },

        realTimeUpdateLogic: function(onNew) {

            _.defer(_.bind(function() { // binding many consecutive events freezes the ui (happens if there are a lot of app components)
                this.listenTo(inspectedPageClient, "backboneAgent:report", _.bind(function(report) {
                    if (report.name == "action" && report.componentCategory == this.component.category &&
                        report.componentIndex === this.component.get("component_index"))
                    {
                        onNew(report.componentActionIndex, report.timestamp);
                    }
                }, this));

                // l'avvio della realTimeUpdate è rimandato con la defer, per cui eventuali report
                // inviati tra l'esecuzione e l'effettivo avvio di questa non sono stati gestiti,
                // facendo la fetch adesso si ottiene allora lo stato comprensivo degli eventuali cambiamenti,
                // dopodichè i prossimi report saranno gestiti.
                this.fetch();
            }, this));
        }

    });
    return AppComponentActions;
});
