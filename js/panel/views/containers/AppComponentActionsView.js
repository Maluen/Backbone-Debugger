define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
        "views/AppComponentActionView", "text!templates/appComponentActions.html"],
function(Backbone, _, $, Handlebars, CollectionView, AppComponentActionView, template) {

    var AppComponentActionsView = CollectionView.extend({

        template: Handlebars.compile(template),
        CollectionItemView: AppComponentActionView,
        collectionElSelector: ".appComponentActionsTable",
        searchFormElSelector: ".searchForm",
        searchTermElSelector: ".searchTerm",

        // true if we can assume that the view is visible (for what concerns the readMoreIfNeeded)
        isVisible: false,

        initialize: function(options) {
            CollectionView.prototype.initialize.apply(this, arguments);

            this.appComponentView = options.parent;
        },

        start: function(onStarted) {
            CollectionView.prototype.start.call(this, _.bind(function() { // on started
                this.listenTo(this.appComponentView, "open show", _.bind(this.checkVisibility, this));
                this.listenTo(this.appComponentView, "close hide", _.bind(this.notifyHidden, this));
                this.checkVisibility();

                this.readMoreIfNeeded();

                if (onStarted) onStarted();
            }, this));
        },

        checkVisibility: function() {
            // set view as visible if the component view is both shown and opened
            if (this.appComponentView.isShown() && this.appComponentView.isOpened()) {
                this.notifyVisible();
            }
        },

        notifyVisible: function() {
            this.isVisible = true;
            this.readMoreIfNeeded();
        },

        notifyHidden: function() {
            this.isVisible = false;
        },

        readMoreIfNeeded: function() {
            if (!this.started) return; // prevent premature call

            setImmediate(_.bind(function() { // wait end of pending browser renders (so to work on updated state)
                if (this.isVisible) {
                    this.collection.readMore(_.bind(this.readMoreIfNeeded, this));
                }
            }, this));
        },

    });
    return AppComponentActionsView;
});
