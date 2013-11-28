/* View for AppView model */

define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appView.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppViewView = AppComponentView.extend({

        template: Handlebars.compile(template),

        events: $.extend({
            "click .printElement": "printElement"
        }, AppComponentView.prototype.events),

        printElement: function() {
            this.model.printElement();
        }

    });
    return AppViewView;
});
