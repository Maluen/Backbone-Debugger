define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appCollection.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppCollectionView = AppComponentView.extend({

        template: Handlebars.compile(template),

        componentStatus: "instantiated", // last sync status, e.g. "read (success)"

        // Change the component status by analyzing its "Sync" actions.
        handleAction: function(action) {
            if (action.get("type") == "Sync") {
                var syncStatus = action.get("name");
                this.componentStatus = syncStatus;
                this.render();
            }
        },

        templateData: function() {
            var templateData = AppComponentView.prototype.templateData.apply(this, arguments);
            // don't close the models list if it was open
            templateData["isModelsOpen"] = this.$(".models").hasClass("in");
            // status
            templateData["component_status"] = this.componentStatus;

            return templateData;
        },

        events: $.extend({

        }, AppComponentView.prototype.events)

    });
    return AppCollectionView;
});
