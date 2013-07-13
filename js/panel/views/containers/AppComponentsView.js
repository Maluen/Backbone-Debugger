define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "text!templates/appComponents.html"],
function(Backbone, _, $, Handlebars, CollectionView, template) {

    var AppComponentsView = CollectionView.extend({

        template: Handlebars.compile(template),
        CollectionItemView: undefined, // oggetto sottotipo di AppComponentView
        collectionElSelector: ".appComponentList",

        events: {
            "click .openAll": "openAll",
            "click .closeAll": "closeAll"
        },

        openAll: function() {
            // don't execute multiple openAll or the operation will slow down
            if (this.openAllInProgress) return;

            this.forEachItemView(_.bind(function(componentView, i, collectionItemViews) {
                // don't move this outside or the operation will never end if there aren't item views
                this.openAllInProgress = true;
                setTimeout(_.bind(function() { // smooth page reflow (one component view at a time)
                    componentView.open();
                    if (i == collectionItemViews.length-1) {
                        // just opened the last item, operation completed
                        this.openAllInProgress = false;
                    }
                }, this), 0);
            }, this));
        },

        closeAll: function() {
            // don't execute multiple closeAll or the operation will slow down
            if (this.closeAllInProgress) return;

            this.forEachItemView(_.bind(function(componentView, i, collectionItemViews) {
                this.closeAllInProgress = true;
                setTimeout(_.bind(function() { // smooth page reflow (one component view at a time)
                    componentView.close();
                    if (i == collectionItemViews.length-1) {
                        // just closed the last item, operation completed
                        this.closeAllInProgress = false;
                    }
                }, this), 0);
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
