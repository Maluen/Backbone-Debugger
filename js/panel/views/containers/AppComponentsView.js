define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "text!templates/appComponents.html", "setImmediate"],
function(Backbone, _, $, Handlebars, CollectionView, template, setImmediate) {

    var AppComponentsView = CollectionView.extend({

        template: Handlebars.compile(template),
        CollectionItemView: undefined, // oggetto sottotipo di AppComponentView
        collectionElSelector: ".appComponentList",
        searchFormElSelector: ".appComponentsOptions .searchForm",
        searchTermElSelector: ".appComponentsOptions .searchTerm",

        events: function() {
            return $.extend({
                "click .openAll": "openAll",
                "click .closeAll": "closeAll",
            }, CollectionView.prototype.events.apply(this, arguments));
        },

        openAll: function() {
            // don't execute multiple openAll or the operation will slow down
            if (this.openAllInProgress) return;

            // the length can increase during the waiting time caused by the defers,
            // therefore to check if we have opened the last item, we must rely on the original value
            // of when the loop took place (i.e. the number of items to open at that time)
            var collectionItemViewsLength = this.collectionItemViews.length;

            this.forEachItemView(_.bind(function(componentView, i, collectionItemViews) {
                // don't move this outside or the operation will never end if there aren't item views
                this.openAllInProgress = true;
                setImmediate(_.bind(function() { // smooth page reflow (one component view at a time)
                    if (componentView.isShown()) componentView.open();
                    if (i == collectionItemViewsLength-1) {
                        // just opened the last item, operation completed
                        this.openAllInProgress = false;
                    }
                }, this));
            }, this));
        },

        closeAll: function() {
            // don't execute multiple closeAll or the operation will slow down
            if (this.closeAllInProgress) return;

            // see openAll
            var collectionItemViewsLength = this.collectionItemViews.length;

            this.forEachItemView(_.bind(function(componentView, i, collectionItemViews) {
                this.closeAllInProgress = true;
                setImmediate(_.bind(function() { // smooth page reflow (one component view at a time)
                    if (componentView.isShown()) componentView.close();
                    if (i == collectionItemViewsLength-1) {
                        // just closed the last item, operation completed
                        this.closeAllInProgress = false;
                    }
                }, this));
            }, this));
        },

        getComponentView: function(componentIndex) {
            // cerca la vista del componente
            for (var i=0,l=this.collectionItemViews.length; i<l; i++) {
                var currentComponentView = this.collectionItemViews[i];
                var currentComponent = currentComponentView.model;
                if (currentComponent.get("component_index") === componentIndex) {
                    return currentComponentView;
                }
            }

            return;
        }

    });
    return AppComponentsView;
});
