define(["backbone", "underscore", "jquery", "views/containers/AppComponentsView",
        "collections/appViews" , "views/AppViewView"],
function(Backbone, _, $, AppComponentsView, appViews, AppViewView) {

    var AppViewsView = AppComponentsView.extend({

        collection: appViews,
        CollectionItemView: AppViewView,

        events: function() {
            return $.extend({
                "mouseenter .appComponentToggle": "highlightDOMElement",
                "mouseleave .appComponentToggle": "unHighlightDOMElementUnlessOpened"
            }, AppComponentsView.prototype.events.apply(this, arguments));
        },

        highlightDOMElement: function(event) {
            var target = $(event.target);
            var componentIndex = parseInt(target.attr("data-component-index"), 10);
            this.getComponentView(componentIndex).highlightDOMElement();
        },

        unHighlightDOMElementUnlessOpened: function(event) {
            var target = $(event.target);
            var componentIndex = parseInt(target.attr("data-component-index"), 10);
            this.getComponentView(componentIndex).unHighlightDOMElementUnlessOpened();
        }

    });
    return AppViewsView;
});
