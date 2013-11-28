define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appCollection.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppCollectionView = AppComponentView.extend({

        template: Handlebars.compile(template),

        templateData: function() {
            var templateData = AppComponentView.prototype.templateData.apply(this, arguments);
            // don't close the models list if it was open
            templateData["isModelsOpen"] = this.$(".models").hasClass("in");

            return templateData;
        },

        events: $.extend({
            
        }, AppComponentView.prototype.events)

    });
    return AppCollectionView;
});
