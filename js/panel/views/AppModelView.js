define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "templates/appModel"],
function(Backbone, _, $, AppComponentView, template) {

    var AppModelView = AppComponentView.extend({

        template: template,

        templateData: function() {
            var templateData = AppComponentView.prototype.templateData.apply(this, arguments);
            // don't close the attributes list if it was open
            templateData["isAttributesOpen"] = this.$(".attributes").hasClass("in");

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
