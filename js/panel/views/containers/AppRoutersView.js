define(["backbone", "underscore", "jquery", "views/containers/AppComponentsView",
        "collections/appRouters" , "views/AppRouterView"],
function(Backbone, _, $, AppComponentsView, appRouters, AppRouterView) {

    var AppRoutersView = AppComponentsView.extend({

        collection: appRouters,
        itemView: AppRouterView

    });
    return AppRoutersView;
});
