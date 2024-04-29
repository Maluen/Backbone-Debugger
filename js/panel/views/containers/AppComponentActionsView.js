define(["backbone", "underscore", "jquery", "views/containers/CollectionView",
        "views/AppComponentActionView", "templates/appComponentActions"],
function(Backbone, _, $, CollectionView, AppComponentActionView, template) {

    var AppComponentActionsView = CollectionView.extend({

        className: 'appComponentActions',
        template: template,

        CollectionItemView: AppComponentActionView,

        collectionElTagName: "tbody",
        collectionElClassName: "appComponentActionsTable",

        searchFormElSelector: ".searchForm",
        searchTermElSelector: ".searchTerm",

        initialize: function(options) {
            CollectionView.prototype.initialize.apply(this, arguments);

            this.appComponentView = options.parent;
        },

        start: function(onStarted) {
            CollectionView.prototype.start.call(this, _.bind(function() { // on started
                this.listenTo(this.appComponentView, "open show", this.checkIfIsInViewport);
                this.listenTo(this.appComponentView, "close hide", this.notifyIsNotInViewport);
                this.checkIfIsInViewport();

                this.readMoreIfNeeded();

                if (onStarted) onStarted();
            }, this));
        },

        checkIfIsInViewport: function() {
            // set view as in viewport if the component view is both shown and opened
            // NOTE: this is a big simplification, in theory we should check if the actions element
            // is actually in the tab viewport but that could case performance issues.
            if (this.appComponentView.isShown() && this.appComponentView.isOpened()) {
                this.notifyIsInViewport();
            }
        }

    });
    return AppComponentActionsView;
});
