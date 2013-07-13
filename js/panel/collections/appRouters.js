define(["backbone", "underscore", "collections/AppComponents", "models/AppRouter"],
function(Backbone, _, AppComponents, AppRouter) {

    var appRouters = new (AppComponents.extend({

        componentCategory: "Router",
        model: AppRouter

    }))();
    return appRouters;
});
