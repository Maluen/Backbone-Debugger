define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appModel.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppModelView = AppComponentView.extend({

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
            // don't close the attributes list if it was open
            templateData["isAttributesOpen"] = this.$(".attributes").hasClass("in");
            // status
            templateData["component_status"] = this.componentStatus;

            return templateData;
        },

        events: $.extend({
            "click .printAppModelAttribute": "printAppModelAttribute"
        }, AppComponentView.prototype.events),

        printAppModelAttribute: function(event) {
            var button = $(event.target);
            var attributeName = button.attr("data-attribute-name");
            this.model.printAttribute(attributeName);
        }

    });
    return AppModelView;
});
