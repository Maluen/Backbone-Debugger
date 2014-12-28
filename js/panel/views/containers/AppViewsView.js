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

        highlightDOMElement: function(e) {
          var componentIndex = Number.parseInt(e.target.dataset.componentIndex);
          this.getComponentView(componentIndex).highlightDOMElement();
        },

        unHighlightDOMElementUnlessOpened: function(e) {
          var componentIndex = Number.parseInt(e.target.dataset.componentIndex);
          this.getComponentView(componentIndex).unHighlightDOMElementUnlessOpened();
        }

    });
    return AppViewsView;
});
