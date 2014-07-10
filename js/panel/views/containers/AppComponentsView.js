define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "text!templates/appComponents.html", "setImmediate"],
function(Backbone, _, $, Handlebars, CollectionView, template, setImmediate) {

    var AppComponentsView = CollectionView.extend({

        template: Handlebars.compile(template),
        itemView: undefined, // oggetto sottotipo di AppComponentView
        collectionElSelector: ".appComponentList",
        searchFormElSelector: ".appComponentsOptions .searchForm",
        searchTermElSelector: ".appComponentsOptions .searchTerm",

        initialize: function() {
            CollectionView.prototype.initialize.apply(this, arguments);

            this.delegate("click", ".openAll", _.bind(this.openAll, this));
            this.delegate("click", ".closeAll", _.bind(this.closeAll, this));
        },

        openAll: function() {
            // don't execute multiple openAll or the operation will slow down
            if (this.openAllInProgress) return;

            var viewsArray = _.values(this.getItemViews());

            // the length can increase during the waiting time caused by the defers,
            // therefore to check if we have opened the last item, we must rely on the original value
            // of when the loop took place (i.e. the number of items to open at that time)
            var viewsLength = viewsArray.length;

            _.each(viewsArray, _.bind(function(componentView, i) {
                // don't move this outside or the operation will never end if there aren't item views
                this.openAllInProgress = true;
                setImmediate(_.bind(function() { // smooth page reflow (one component view at a time)
                    if (componentView.isShown()) componentView.open();
                    if (i == viewsLength-1) {
                        // just opened the last item, operation completed
                        this.openAllInProgress = false;
                    }
                }, this));
            }, this));
        },

        closeAll: function() {
            // don't execute multiple closeAll or the operation will slow down
            if (this.closeAllInProgress) return;

            var viewsArray = _.values(this.getItemViews());

            // see openAll
            var viewsLength = viewsArray.length;

            _.each(viewsArray, _.bind(function(componentView, i) {
                this.closeAllInProgress = true;
                setImmediate(_.bind(function() { // smooth page reflow (one component view at a time)
                    if (componentView.isShown()) componentView.close();
                    if (i == viewsLength-1) {
                        // just closed the last item, operation completed
                        this.closeAllInProgress = false;
                    }
                }, this));
            }, this));
        },

        // return the component view
        getComponentView: function(componentIndex) {
            var component;
            _.each(this.getItemViews(), _.bind(function(componentView) {
                var currentComponent = componentView.model;
                if (currentComponent.get("component_index") === componentIndex) {
                    component = currentComponent;
                }
            }, this));
            return component;
        }

    });
    return AppComponentsView;
});
