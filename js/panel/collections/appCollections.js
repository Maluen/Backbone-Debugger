define(["backbone", "underscore", "collections/AppComponents", "models/AppCollection"],
function(Backbone, _, AppComponents, AppCollection) {

    var appCollections = new (AppComponents.extend({

        componentCategory: "Collection",
        model: AppCollection

    }))();
    return appCollections;
});
