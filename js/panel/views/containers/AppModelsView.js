define(["backbone", "underscore", "jquery", "views/containers/AppComponentsView",
        "collections/appModels" , "views/AppModelView"],
function(Backbone, _, $, AppComponentsView, appModels, AppModelView) {

    var AppModelsView = AppComponentsView.extend({

        collection: appModels,
        CollectionItemView: AppModelView

    });
    return AppModelsView;
});
