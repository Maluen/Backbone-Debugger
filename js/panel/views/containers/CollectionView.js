/* Vista per una collezione, crea una sottovista per ogni item (modello) della collezione.
   Nota: la collezione può essere passata anche direttamente nel costruttore (grazie a Backbone.View).
   VINCOLO: se all'atto della render ci sono item, il template deve stampare il collectionEl
            (l'elemento che contiene gli el delle viste degli item), 
            ciò è necessario per il funzionamento della gestione separata di tale collectionEl
            (vedi metodo render). */

define(["backbone", "underscore", "jquery", "views/View", "handlebars", "filters/SearchFilter", "setImmediate"],
function(Backbone, _, $, View, Handlebars, SearchFilter, setImmediate) {

    var AppComponentsView = View.extend({

        template: undefined,

        CollectionItemView: undefined, // tipo vista di un item
        collectionElSelector: undefined, // selettore per l'elemento html che contiene gli el delle viste degli item

        filter: undefined,

        searchFormElSelector: undefined, // jquery selector for the search form element (if any)
        searchTermElSelector: undefined, // jquery selector for the search form term input element (if any)
        searchTriggerTimeout: 500, // number of ms after search field has changed to automatically trigger the search

        searchTerm: undefined, // currently used search term

        events: function() {
            var e = {};
            e["input "+this.searchTermElSelector] = "startSearchTriggerTimer";
            e["reset "+this.searchFormElSelector] = "startSearchTriggerTimer";
            e["submit "+this.searchFormElSelector] = "searchCurrent";
            return e;
        },

        initialize: function(options) {
            _.bindAll(this);

            // array con una vista per ogni item
            this.collectionItemViews = [];

            // handle new items
            this.listenTo(this.collection, "reset", _.bind(function() {
                setImmediate(_.bind(function() { // needed to handle the reset after pending deferred adds
                    // gestisce i nuovi item
                    this.clearItems();
                    this.render();
                    for (var i=0,l=this.collection.length; i<l; i++) {
                        var collectionItem = this.collection.at(i);
                        this.handleNewItem(collectionItem);
                    }
                }, this));
            }, this));
            this.listenTo(this.collection, "add", this.handleNewItem);

            this.render();
        },

        // Resetta l'array delle viste degli item
        // N.B: la render NON verrà chiamata!
        clearItems: function() {
            for (var i=0; i<this.collectionItemViews.length; i++) {
                var collectionItemView = this.collectionItemViews[i];
                this.stopListening(collectionItemView);
                if (this.filter) {
                    // disable the live filter check
                    // (prevents the calling of the expired callback on the 'dead' model)
                    this.filter.liveMatch(collectionItemView.model, false);
                }
                collectionItemView.remove();
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
                // retrigger the child view events, so to have a global proxy
                // (used to react to child events, like hide/show, for example to load more components if needed)
                this.listenTo(newCollectionItemView, "all", _.bind(function(eventName) {
                    this.trigger("child:"+eventName, newCollectionItemView);
                }, this));

                // quando si passa da 0 elementi ad un 1 elemento bisogna fare la render in modo
                // che il template inserisca il collectionEl, per poterlo poi gestire manualmente;
                // inoltre evitando di rifare la render ogni volta si impedisce l'effetto "sfarfallio" che
                // non permette di aprire i componenti durante l'aggiunta continuativa di questi, a causa
                // dell'animazione Bootstrap che viene interrotta.
                if (this.collectionItemViews.length == 1) this.render();
                // aggiunge al collectionEl l'el per la vista del nuovo item alla posizione corretta
                var collectionEl = this.$(this.collectionElSelector);
                if (collectionItemIndex == 0) {
                    // primo el
                    collectionEl.prepend(newCollectionItemView.el);
                } else {
                    // inserisce l'el dopo il vicino sinistro
                    var collectionItemViewLeftSibling = this.collectionItemViews[collectionItemIndex-1];
                    newCollectionItemView.$el.insertAfter(collectionItemViewLeftSibling.$el);
                }

                // apply the filter in order to immediately hide the view if its model doesn't pass the filter.
                if (this.filter) {
                    this.filter.liveMatch(newCollectionItemView.model, true, function(model, newMatchResult) {
                        newCollectionItemView.show(newMatchResult); // hide or show the view
                    });
                }
            }, this));
        },

        // Crea un nuova vista per l'item e la restituisce.
        // N.B: la render NON verrà chiamata!
        addItem: function(collectionItem, collectionItemIndex) {
            var collectionItemView = new this.CollectionItemView({
                model: collectionItem
            });
            this.collectionItemViews.splice(collectionItemIndex, 0, collectionItemView);
            return collectionItemView;
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

        // Set filter as the active filter, removing the old one if exists.
        // Note: if filter is undefined, then the method will just remove the existing filter.
        resetFilter: function(filter) {
            setImmediate(_.bind(function() { // wait old deferred reset completitions
                // remove existing filter
                if (this.filter) {
                    this.filter.remove();
                    this.filter = undefined;
                }

                if (!filter) {
                    // restore views visibility (no new filter)
                    _.each(this.collectionItemViews, function(view) {
                        setImmediate(function() { // defer to prevent UI blocking
                            view.show(true);
                        });
                    }, this);
                } else {
                    // set & apply new filter
                    this.filter = filter;
                    _.each(this.collectionItemViews, function(view) {
                        filter.liveMatch(view.model, true, function(model, newMatchResult) {
                            setImmediate(function() { // defer to prevent UI blocking
                                view.show(newMatchResult); // hide or show the view based on the filter result
                            });
                        });
                    }, this);
                }
            }, this));
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
                this.resetFilter();
            } else {
                // apply the new filter
                this.resetFilter(new SearchFilter(searchTerm));
            }
        },

        render: function() {
            // recupera il contenitore con gli el delle viste degli item per reinserirlo poi,
            // infatti tali el vengono aggiunti/rimossi a parte in base agli eventi della collezione,
            // in modo da non doverli riappendere tutti da capo ad ogni render,
            // ciò diminuisce drasticamente l'uso della cpu che altrimenti si fa sentire in caso di
            // molti add ravvicinati (causati dall'aggiornamento in tempo reale)
            var collectionEl = this.$(this.collectionElSelector);

            var thereAreItems = (this.collectionItemViews.length!==0);
            this.el.innerHTML = this.template({thereAreItems: thereAreItems}); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
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
