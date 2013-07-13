define(["backbone", "underscore", "jquery", "views/containers/AppComponentsView",
        "collections/appViews" , "views/AppViewView"],
function(Backbone, _, $, AppComponentsView, appViews, AppViewView) {

    var AppViewsView = AppComponentsView.extend({

        collection: appViews,
        CollectionItemView: AppViewView

    });
    return AppViewsView;
});
