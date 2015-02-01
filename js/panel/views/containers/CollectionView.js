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
        collectionElSelector: undefined, // selettore per l'elemento html che contiene gli el delle viste degli item

        started: false,

        // number of milliseconds to pass to the debounce function (e.g. for scroll events)
        debounceDuration: 100,

        // state if the view (tab) is visible by the user (for what concerns the readMoreIfNeeded)
        isInViewport: false,

        isReadMoreHidden: false, // state if the 'read more' button is hidden
        readMoreElSelector: '.readMore', // read more button selector

        searchFormElSelector: undefined, // jquery selector for the search form element (if any)
        searchTermElSelector: undefined, // jquery selector for the search form term input element (if any)
        searchTriggerTimeout: 500, // number of ms after search field has changed to automatically trigger the search

        searchTerm: undefined, // currently used search term

        sortSelectElSelector: '.sortForm select',

        events: function() {
            var e = {};
            e["scroll"] = this.localHandler('readMoreIfNeeded', false);
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
                this.render();
                for (var i=0,l=this.collection.length; i<l; i++) {
                    var collectionItem = this.collection.at(i);
                    this.handleNewItem(collectionItem);
                }
                // there could be less items than before,
                // thus the read more button could have become visible
                this.readMoreIfNeeded();
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

                // quando si passa da 0 elementi ad un 1 elemento bisogna fare la render in modo
                // che il template inserisca il collectionEl, per poterlo poi gestire manualmente;
                // inoltre evitando di rifare la render ogni volta si impedisce l'effetto "sfarfallio" che
                // non permette di aprire i componenti durante l'aggiunta continuativa di questi, a causa
                // dell'animazione Bootstrap che viene interrotta.
                if (this.collectionItemViews.length == 1) this.render();

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
                    var collectionEl = this.$(this.collectionElSelector);
                    collectionEl.prepend(newCollectionItemView.el);
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
                setImmediate(function() { // defer to prevent UI blocking
                    collectionItemView.show(true);
                });
            }, this));

            this.listenTo(this.collection, "hidden:"+collectionItem.index, _.bind(function() {
                setImmediate(_.bind(function() { // defer to prevent UI blocking
                    collectionItemView.show(false);

                    // less visible items -> read more could be needed
                    this.readMoreIfNeeded();
                }, this));
            }, this));
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
                thereAreItems: this.collectionItemViews.length !== 0,
                isReadMoreHidden: this.isReadMoreHidden, // keep button visiblity between renders
                sortType: this.collection.orderReverse ? 'reverse' : 'normal'
            };
        },

        render: function() {
            // recupera il contenitore con gli el delle viste degli item per reinserirlo poi,
            // infatti tali el vengono aggiunti/rimossi a parte in base agli eventi della collezione,
            // in modo da non doverli riappendere tutti da capo ad ogni render,
            // ciò diminuisce drasticamente l'uso della cpu che altrimenti si fa sentire in caso di
            // molti add ravvicinati (causati dall'aggiornamento in tempo reale)
            var collectionEl = this.$(this.collectionElSelector);

            var thereAreItems = (this.collectionItemViews.length!==0);
            this.el.innerHTML = this.template(this.templateData()); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            // reinserisce il contenitore con gli el delle viste (se applicabile)
            if (thereAreItems && collectionEl.length > 0) {
                var placeholderCollectionEl = this.$(this.collectionElSelector);
                placeholderCollectionEl.replaceWith(collectionEl);
            }

            // keep current search term (we don't set it via template to enable reset to empty string)
            this.$(this.searchTermElSelector).val(this.searchTerm);

            return this;
        }
    });
    return AppComponentsView;
});
