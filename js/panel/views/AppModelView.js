define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appModel.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppModelView = AppComponentView.extend({

        template: Handlebars.compile(template),

        initialize: function() {
            AppComponentView.prototype.initialize.apply(this, arguments);

            this.delegate('click', '.printAppModelAttribute', _.bind(this.printAppModelAttribute, this));
        },

        getTemplateData: function() {
            var templateData = AppComponentView.prototype.templateData.apply(this, arguments);
            // don't close the attributes list if it was open
            templateData["isAttributesOpen"] = this.$(".attributes").hasClass("in");

            return templateData;
        },

        printAppModelAttribute: function(event) {
            var button = $(event.target);
            var attributeName = button.attr("data-attribute-name");
            this.model.printAttribute(attributeName);
        }

    });
    return AppModelView;
});
