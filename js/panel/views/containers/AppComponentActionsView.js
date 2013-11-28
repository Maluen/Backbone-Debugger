define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "views/AppComponentActionView", "text!templates/appComponentActions.html"],
function(Backbone, _, $, Handlebars, CollectionView, AppComponentActionView, template) {

    var AppComponentActionsView = CollectionView.extend({

        template: Handlebars.compile(template),
        CollectionItemView: AppComponentActionView,
        collectionElSelector: ".appComponentActionsTable"

    });
    return AppComponentActionsView;
});
