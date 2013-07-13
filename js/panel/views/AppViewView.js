/* View for AppView model */

define(["backbone", "underscore", "jquery", "views/AppComponentView", 
        "handlebars", "text!templates/appView.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {
    
    var AppViewView = AppComponentView.extend({

        template: Handlebars.compile(template),

        componentStatus: "Created", // can be "Created", "Rendered" or "Removed"

        // Change the component status by analyzing its "Operation" actions.
        handleAction: function(action) {
            if (action.get("type") == "Operation") {
                var operationName = action.get("name");
                if (operationName == "render") {
                    this.componentStatus = "Rendered";
                } else if (operationName == "remove") {
                    this.componentStatus = "Removed";
                }
                this.render();
            }
        },

        // Augment template data with the component status
        templateData: function() {
            var templateData = AppComponentView.prototype.templateData.apply(this, arguments);
            templateData["component_status"] = this.componentStatus;
            
            return templateData;
        },

        events: $.extend({
            "click .printElement": "printElement"
        }, AppComponentView.prototype.events),

        printElement: function() {
            this.model.printElement();
        }

    });
    return AppViewView;
});