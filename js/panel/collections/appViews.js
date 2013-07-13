define(["backbone", "underscore", "collections/AppComponents", "models/AppView"],
function(Backbone, _, AppComponents, AppView) {

    var appViews = new (AppComponents.extend({

        componentCategory: "View",
        model: AppView

    }))();
    return appViews;
});
