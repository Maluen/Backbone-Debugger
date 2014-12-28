define(["backbone", "underscore", "jquery", "views/containers/AppComponentsView",
        "collections/appViews" , "views/AppViewView"],
function(Backbone, _, $, AppComponentsView, appViews, AppViewView) {

    var AppViewsView = AppComponentsView.extend({

        collection: appViews,
        CollectionItemView: AppViewView,

        events: function() {
            return $.extend({
                "mouseover .appComponentList>li": "highlightViewElement",
                "mouseleave .appComponentList>li": "unhighlightViewElements"
            }, AppComponentsView.prototype.events.apply(this, arguments));
        },

        highlightViewElement: function(event) {
            var appComponentToggle = $(event.currentTarget).find('.appComponentToggle');
            var componentIndex = parseInt(appComponentToggle.attr("data-component-index"), 10);
            this.getComponentView(componentIndex).highlightElement();
        },

        unhighlightViewElements: function() {
            this.collection.unhighlightViewElements();
        }

    });
    return AppViewsView;
});
