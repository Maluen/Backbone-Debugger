define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "views/AppComponentActionView", "text!templates/appComponentActions.html"],
function(Backbone, _, $, Handlebars, CollectionView, AppComponentActionView, template) {

    var AppComponentActionsView = CollectionView.extend({

        template: Handlebars.compile(template),
        itemView: AppComponentActionView,
        collectionElSelector: ".appComponentActionsTable",
        searchFormElSelector: ".searchForm",
        searchTermElSelector: ".searchTerm"

    });
    return AppComponentActionsView;
});
