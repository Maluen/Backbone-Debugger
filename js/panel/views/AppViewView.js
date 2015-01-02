/* View for AppView model */

define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appView.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppViewView = AppComponentView.extend({

        template: Handlebars.compile(template),

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
