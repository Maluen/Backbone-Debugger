/* View for AppView model */

define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appView.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppViewView = AppComponentView.extend({

        template: Handlebars.compile(template),

        initialize: function() {
            AppComponentView.prototype.initialize.apply(this, arguments);

            this.delegate('click', '.printElement', _.bind(printElement, this));
        },

        printElement: function() {
            this.model.printElement();
        }

    });
    return AppViewView;
});
