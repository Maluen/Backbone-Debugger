define(["backbone", "underscore", "collections/AppComponents", "models/AppModel"],
function(Backbone, _, AppComponents, AppModel) {

    var appModels = new (AppComponents.extend({

        componentCategory: "Model",
        model: AppModel

    }))();
    return appModels;
});
