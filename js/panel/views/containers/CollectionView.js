/* Vista per una collezione, crea una sottovista per ogni item (modello) della collezione.
   Nota: la collezione può essere passata anche direttamente nel costruttore (grazie a Backbone.View).
   VINCOLO: se all'atto della render ci sono item, il template deve stampare il collectionEl
            (l'elemento che contiene gli el delle viste degli item), 
            ciò è necessario per il funzionamento della gestione separata di tale collectionEl
            (vedi metodo render). */

define(["backbone", "underscore", "jquery", "views/View", "handlebars", "setImmediate"],
function(Backbone, _, $, View, Handlebars, setImmediate) {

    var AppComponentsView = View.extend({

        template: undefined,

        CollectionItemView: undefined, // tipo vista di un item

        // tag name of the collection el, used to create it
        collectionElTagName: undefined,
        // class name of the collection el, used to create it
        collectionElClassName: undefined,

        started: false,

        // selettore per l'elemento html (placeholder) che contiene gli el delle viste degli item
        collectionElPlaceholderSelector: "[data-placeholder='collectionEl']",

        // Note: is relative to the visible items only
        thereAreItems: false,

        // number of milliseconds to pass to the debounce function (e.g. for scroll events)
        debounceDuration: 100,

        // state if the view (tab) is visible by the user (for what concerns the readMoreIfNeeded)
        isInViewport: false,

        isReadMoreHidden: false, // state if the 'read more' button is hidden
        readMoreElSelector: ".readMore", // read more button selector

        searchFormElSelector: undefined, // jquery selector for the search form element (if any)
        searchTermElSelector: undefined, // jquery selector for the search form term input element (if any)
        searchTriggerTimeout: 500, // number of ms after search field has changed to automatically trigger the search

        searchTerm: undefined, // currently used search term

        sortSelectElSelector: ".sortForm select",

        events: function() {
            var e = {};
            e["scroll"] = this.localHandler("readMoreIfNeeded", false);
            e["click .readMore"] = this.localHandler("readMore", false);

            e["input "+this.searchTermElSelector] = this.localHandler("startSearchTriggerTimer");
            e["reset "+this.searchFormElSelector] = this.localHandler("startSearchTriggerTimer");
            e["submit "+this.searchFormElSelector] = this.localHandler("searchCurrent", false);

            e['change '+this.sortSelectElSelector] = this.localHandler("sortSelectChange");

            return e;
        },

        initialize: function(options) {
            View.prototype.initialize.apply(this, arguments);

            // array of item views
            this.collectionItemViews = [];

            // DOM element that will contain all the item view elements,
            // is attached to the page on render by replacing the placeholder element
            // that is on the template.
            // TODO: could be refactored as a sub view,
            // meaning this view is probably more than a collection view!
            this.collectionEl = this.createCollectionEl();

            this.listenTo(this.collection, "reset", _.bind(this.handleReset, this));
            this.listenTo(this.collection, "add", this.handleNewItem);

            // hash <model index, item>
            // contains the items that should have been removed, but that are kept
            // for reusing in case the model returns visible (it likely will)
            this.detachedItemViews = {};

            // debounce and bind the readMoreIfNeeded function
            var readMoreIfNeeded = this.readMoreIfNeeded;
            this.readMoreIfNeeded = _.debounce(_.bind(readMoreIfNeeded, this), this.debounceDuration);

            this.start();
        },

        createCollectionEl: function() {
            var collectionEl = document.createElement(this.collectionElTagName);
            collectionEl.className = this.collectionElClassName || '';
            collectionEl = $(collectionEl);
            return collectionEl;
        },

        start: function(onStarted) {
            this.collection.start(_.bind(function() { // on started
                this.render();
                this.started = true;
                if (onStarted) onStarted();
            }, this));
        },

        handleReset: function() {
            setImmediate(_.bind(function() { // needed to handle the reset after pending deferred adds
                // handle new items
                this.clearItems();
                for (var i=0,l=this.collection.length; i<l; i++) {
                    var collectionItem = this.collection.at(i);
                    this.handleNewItem(collectionItem);
                }
                // there could be less items than before
                this.handleIfLessVisibleItems();
            }, this));
        },

        // Resetta l'array delle viste degli item
        // N.B: la render NON verrà chiamata!
        clearItems: function() {
            for (var i=0; i<this.collectionItemViews.length; i++) {
                var collectionItemView = this.collectionItemViews[i];
                this.stopListening(collectionItemView);

                // instead of destroying the item view, keep its reference for reusing it
                collectionItemView.$el.detach(); // remove from DOM (can be readded later)
                this.detachedItemViews[collectionItemView.model.index] = collectionItemView;
            };
            this.collectionItemViews = [];
        },

        // Aggiunge l'elemento e lo visualizza nel DOM
        handleNewItem: function(collectionItem) {
            // don't move the indexOf calculation inside the setImmediate or we'll have an invalid value if
            // other new items are prepended during the waiting time
            var collectionItemIndex = this.collection.indexOf(collectionItem);
            setImmediate(_.bind(function() { // prevents UI blocking
                var newCollectionItemView = this.addItem(collectionItem, collectionItemIndex);

                // find the DOM position in which to add the new view element:
                // after its left sibling if exists, as first otherwise.

                // because of collection comparators, the sequence of add events can be in any order with respect
                // to the order in which the models have been added to the collection (in case of batch add).
                // hence, there is no assurance that the view for the model with the previous index
                // has already been created

                var collectionItemViewLeftSibling;
                for (var i=collectionItemIndex-1; i>=0; i--) {
                    var view = this.collectionItemViews[i];
                    if (view) {
                        collectionItemViewLeftSibling = view;
                        break;
                    }
                }
                if (!collectionItemViewLeftSibling) {
                    // first element
                    this.collectionEl.prepend(newCollectionItemView.el);
                } else {
                    // add the element after its left sibling
                    newCollectionItemView.$el.insertAfter(collectionItemViewLeftSibling.$el);
                }

                // must be explicitly called or we won't have the child:show event
                // that someone might need (the AppComponentsView searchComponent)
                // TODO: it's kinda ugly to have to do this
                newCollectionItemView.show(true);
            }, this));
        },

        // Note: the render won't be called!
        // Note: collectionItemIndex is different from collectionItem.index
        // since the former is the position in the collection
        // (a filtered collection could show only 1 model with index 34)
        // TODO: refactor the above naming to make it more clear
        addItem: function(collectionItem, collectionItemIndex) {
            var collectionItemView = this.createItemView(collectionItem);
            this.collectionItemViews.splice(collectionItemIndex, 0, collectionItemView);

            return collectionItemView;
        },

        createItemView: function(collectionItem) {
            var collectionItemView;

            var detachedView = this.detachedItemViews[collectionItem.index];
            if (detachedView) {
                // exists in the detached view, reuse
                collectionItemView = detachedView;
                delete this.detachedItemViews[collectionItem.index]; // not detached anymore
            } else {
                collectionItemView = new this.CollectionItemView({
                    model: collectionItem
                });
            }

            this.hookItemView(collectionItemView);

            return collectionItemView;
        },

        // setup listening for new item view
        hookItemView: function(collectionItemView) {
            var collectionItem = collectionItemView.model;

            // retrigger the child view events, so to have a global proxy
            // (used to react to child events, like hide/show, 
            // for example to read more components if needed)
            this.listenTo(collectionItemView, "all", _.bind(function(eventName) {
                this.trigger("child:"+eventName, collectionItemView);
            }, this));

            this.listenTo(this.collection, "visible:"+collectionItem.index, _.bind(function() {
                setImmediate(_.bind(function() { // defer to prevent UI blocking
                    collectionItemView.show(true);
                }, this));
            }, this));

            this.listenTo(this.collection, "hidden:"+collectionItem.index, _.bind(function() {
                setImmediate(_.bind(function() { // defer to prevent UI blocking
                    collectionItemView.show(false);
                }, this));
            }, this));

            this.listenTo(collectionItemView, "show", _.bind(this.handleIfMoreVisibleItems, this));
            this.listenTo(collectionItemView, "hide", _.bind(this.handleIfLessVisibleItems, this));
        },

        // call this when there could be more visible items
        handleIfMoreVisibleItems: function() {
            // TODO: this should be automatic and more clever via data-binding or similar
            if (this.collection.visibleModelsLength != 0 && !this.thereAreItems) {
                this.thereAreItems = true;
                this.render();
            }
        },

        // call this when there could be less visible items
        handleIfLessVisibleItems: function() {
            // -> there might be no visible item anymore
            // TODO: this should be automatic and more clever via data-binding or similar
            if (this.collection.visibleModelsLength == 0 && this.thereAreItems) {
                this.thereAreItems = false;
                this.render();
            }

            // -> read more could be needed
            this.readMoreIfNeeded();
        },

        // N.B: il metodo è sincrono!
        // handleItemView viene chiamata per ogni item view passandoglielo insieme al suo indice
        // e all'array con tutte le viste degli item.
        forEachItemView: function(handleItemView) {
            for (var i=0,l=this.collectionItemViews.length; i<l; i++) {
                var collectionItemView = this.collectionItemViews[i];
                handleItemView(collectionItemView, i, this.collectionItemViews);
            }
        },

        notifyIsInViewport: function() {
            this.isInViewport = true;
            this.readMoreIfNeeded();
        },

        notifyIsNotInViewport: function() {
            this.isInViewport = false;
        },

        isReadMoreNeeded: function() {
            if (this.el.clientHeight === 0) {
                // still not ready (prevents tons of reads while initializing)
                return false;
            }

            var isBottomInViewport = this.$el.scrollTop() + this.el.clientHeight >= this.el.scrollHeight;
            return this.isInViewport && isBottomInViewport;
        },

        // Read more items if the user reached the bottom of the view
        // Note: the function is automatically debounced and binded on initialize.
        readMoreIfNeeded: function() {
            if (!this.started) return; // prevent premature call

            setImmediate(_.bind(function() { // wait end of pending browser renders (so to work on updated state)
                if (this.isReadMoreNeeded()) {
                    this.readMore(_.bind(function() { // on complete
                        this.readMoreIfNeeded();
                    }, this));
                }
            }, this));
        },

        readMore: function(onComplete) {
            this.showReadMore(false);

            this.collection.readMore(_.bind(function() { // on complete
                // show read more button (provided as a last resort, manual method, to read more in case
                // the user is somewhat able to reach the bottom without being catched, 
                // e.g. after an untracked view height drecrease)
                this.showReadMore(true);

                if (onComplete) onComplete();
            }, this));
        },

        // show or hide the read more button
        showReadMore: function(showOrHide) {
            // first() needed to prevent toggling of button in eventual child CollectionView
            // (toggleClass applies to eacb element in the set)
            this.$(this.readMoreElSelector).first().toggleClass('hidden', !showOrHide);
            this.isReadMoreHidden = !showOrHide;
        },

        startSearchTriggerTimer: function(event) {
            if (this.searchTriggerTimer) this.searchTriggerTimer = clearTimeout(this.searchTriggerTimer);
            this.searchTriggerTimer = setTimeout(_.bind(this.searchCurrent, this), this.searchTriggerTimeout);
        },

        searchCurrent: function() {
            var searchTerm = this.$(this.searchTermElSelector).val();
            this.search(searchTerm);
            return false; // prevent real submit of form (if any)
        },

        search: function(searchTerm) {
            // needed if the user manually started the search and there are pending search triggers
            if (this.searchTriggerTimer) this.searchTriggerTimer = clearTimeout(this.searchTriggerTimer);

            this.searchTerm = searchTerm;
            this.$(this.searchTermElSelector).val(searchTerm);

            if (searchTerm === "") {
                // just remove the filter
                this.collection.setFilter(null);
            } else {
                // apply the new filter
                this.collection.setFilter('search', {
                    searchTerm: searchTerm
                });
            }
        },

        sortSelectChange: function(event) {
            var selectEl = $(event.currentTarget);

            var sortType = selectEl.val(); // 'normal' or 'reverse'
            var isReverseOrder = (sortType == 'reverse') ? true : false;

            this.collection.setOrderReverse(isReverseOrder);
        },

        templateData: function() {
            return {
                thereAreItems: this.thereAreItems,
                isReadMoreHidden: this.isReadMoreHidden, // keep button visibility between renders
                sortType: this.collection.orderReverse ? 'reverse' : 'normal'
            };
        },

        render: function() {
            this.el.innerHTML = this.template(this.templateData()); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            
            var collectionElPlaceholder = this.$(this.collectionElPlaceholderSelector);
            if (collectionElPlaceholder.length > 0) { // there is the intention of displaying the item views
                collectionElPlaceholder.replaceWith(this.collectionEl);
            }

            // keep current search term (we don't set it via template to enable reset to empty string)
            this.$(this.searchTermElSelector).val(this.searchTerm);

            return this;
        }
    });
    return AppComponentsView;
});
