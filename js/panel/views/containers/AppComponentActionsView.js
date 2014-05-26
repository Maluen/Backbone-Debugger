define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "views/AppComponentActionView", "text!templates/appComponentActions.html", "filters/SearchFilter"],
function(Backbone, _, $, Handlebars, CollectionView, AppComponentActionView, template, SearchFilter) {

    var AppComponentActionsView = CollectionView.extend({

        template: Handlebars.compile(template),
        CollectionItemView: AppComponentActionView,
        collectionElSelector: ".appComponentActionsTable",

        events: {
            "submit .searchForm": "onSearchSubmit"
        },

        onSearchSubmit: function(event) {
            var searchTerm = $(event.target).find('.searchTerm').val();
            this.search(searchTerm);
            return false; // prevent real submit of form
        },

        search: function(searchTerm) {
            this.$('.searchTerm').val(searchTerm);
            
            if (searchTerm === "") {
                // just remove the filter
                this.resetFilter();
            } else {
                // apply the new filter
                this.resetFilter(new SearchFilter(searchTerm));
            }
        },

    });
    return AppComponentActionsView;
});
