/* View for AppView model */

define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "templates/appView"],
function(Backbone, _, $, AppComponentView, template) {

    var AppViewView = AppComponentView.extend({

        template: template,

        events: $.extend({
            "click .printElement": "printElement",
            "click .inspectElement": "inspectElement"
        }, AppComponentView.prototype.events),

        printElement: function() {
            this.model.printElement();
        },

        inspectElement: function() {
            this.model.inspectElement();
        },

        highlightElement: function() {
            this.model.highlightElement();
        }

    });
    return AppViewView;
});
