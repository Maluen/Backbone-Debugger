define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "text!templates/appComponents.html", "setImmediate"],
function(Backbone, _, $, Handlebars, CollectionView, template, setImmediate) {

    var AppComponentsView = CollectionView.extend({

        template: Handlebars.compile(template),
        CollectionItemView: undefined, // oggetto sottotipo di AppComponentView
        collectionElSelector: ".appComponentList",
        searchFormElSelector: ".appComponentsOptions .searchForm",
        searchTermElSelector: ".appComponentsOptions .searchTerm",

        isOpened: false, // state if the view (tab) is opened

        // number of milliseconds to pass to the debounce function (e.g. for scroll events)
        debounceDuration: 100,

        isLoadMoreHidden: false, // state if the 'load more' button is hidden

        events: function() {
            return $.extend({
                "click .openAll": "openAll",
                "click .closeAll": "closeAll",
                "scroll": "loadMoreIfNeeded",
                "click .loadMore": "loadMoreIfNeeded"
            }, CollectionView.prototype.events.apply(this, arguments));
        },

        initialize: function() {
            CollectionView.prototype.initialize.apply(this, arguments);

            // debounce and bind the loadMoreIfNeeded function
            var loadMoreIfNeeded = this.loadMoreIfNeeded;
            this.loadMoreIfNeeded = _.debounce(_.bind(loadMoreIfNeeded, this), this.debounceDuration);

            $(window).on('resize', this.loadMoreIfNeeded);
            this.listenTo(this, "child:close child:hide child:collapsable:close", this.loadMoreIfNeeded);
        },

        // Call this function to notify the view that it has been opened (since is a tab)
        notifyOpened: function() {
            this.isOpened = true;
            this.loadMoreIfNeeded();

            // HACK: give focus to the view, otherwise mousewheel scrolling won't work
            this.render();
        },

        // Call this function to notify the view that it has been opened (since is a tab)
        notifyClosed: function() {
            this.isOpened = false;
        },

        // Load more items if the user reached the bottom of the view
        // Note: the function is automatically debounced and binded on initialize.
        loadMoreIfNeeded: function() {
            setImmediate(_.bind(function() { // wait end of pending browser renders (so to work on updated state)
                if (this.isOpened && this.$el.scrollTop() + this.$el[0].clientHeight == this.$el[0].scrollHeight) {

                    this.showLoadMore(false);

                    this.collection.loadMore(_.bind(function() { // on complete
                        // show load more button (provided as a last resort, manual method, to load more in case
                        // the user is somewhat able to reach the bottom without being catched, 
                        // e.g. after an untracked component height drecrease)
                        this.showLoadMore(true);

                        this.loadMoreIfNeeded();
                    }, this));
                
                }
            }, this));
        },

        // show or hide the load more button
        showLoadMore: function(showOrHide) {
            this.$('.loadMore').toggleClass('hidden', !showOrHide);
            this.isLoadMoreHidden = !showOrHide;
        },

        templateData: function() {
            return _.extend({
                'isLoadMoreHidden': this.isLoadMoreHidden // keep button visiblity between renders
            }, CollectionView.prototype.templateData.apply(this, arguments));
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
                if (currentComponent.index === componentIndex) {
                    return currentComponentView;
                }
            }

            return;
        }

    });
    return AppComponentsView;
});
