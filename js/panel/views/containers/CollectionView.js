/* Vista per una collezione, crea una sottovista per ogni item (modello) della collezione.
   Nota: la collezione deve supportare l'aggiornamento in tempo reale e può essere passata
   anche direttamente nel costruttore (grazie a Backbone.View).
   VINCOLO: se all'atto della render ci sono item, il template deve stampare il collectionEl
            (l'elemento che contiene gli el delle viste degli item), 
            ciò è necessario per il funzionamento della gestione separata di tale collectionEl
            (vedi metodo render). */

define(["backbone", "underscore", "jquery", "chaplin", "views/View", "handlebars", "filters/SearchFilter", "setImmediate"],
function(Backbone, _, $, Chaplin, View, Handlebars, SearchFilter, setImmediate) {

    var CollectionView = Chaplin.CollectionView.extend({

        template: undefined,

        itemView: undefined, // tipo vista di un item
        listSelector: undefined, // selettore per l'elemento html che contiene gli el delle viste degli item
        autoRender: true,

        filter: undefined,

        searchFormElSelector: undefined, // jquery selector for the search form element (if any)
        searchTermElSelector: undefined, // jquery selector for the search form term input element (if any)
        searchTriggerTimeout: 500, // number of ms after search field has changed to automatically trigger the search

        initialize: function(options) {
            Chaplin.CollectionView.prototype.initialize.apply(this, arguments);

            _.bindAll(this);

            this.delegate("input", this.searchTermElSelector, this.startSearchTriggerTimer);
            this.delegate("reset", this.searchFormElSelector, this.startSearchTriggerTimer);
            this.delegate("submit", this.searchFormElSelector, this.searchCurrent);

            this.listenTo(this.collection, "reset", _.bind(function(collection, options) {
                if (this.filter) {
                    for (var i=0; i<options.previousModels.length; i++) {
                        var previousModel = options.previousModels[i];
                        // disable the live filter check
                        // (prevents the calling of the expired callback on the 'dead' model)
                        this.filter.liveMatch(previousModel, false);
                    };
                }
            }, this));

            this.listenTo(this.collection, "add", _.bind(function(model) {
                if (this.filter) {
                    // apply the filter in order to immediately hide the view if its model doesn't pass the filter.
                    // in this way, when added, the view will already have the correct visibility.
                    this.filter.liveMatch(model, true, _.bind(function(model, newMatchResult) {
                        var modelView = this.getItemViews()[model.cid];
                        if (modelView) { // (view for the model exists, we are not before its creation)
                            modelView.show(newMatchResult); // hide or show the view
                        }
                    }, this));
                }
            }, this));

            // recupera item correnti
            this.collection.fetch();
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
                    _.each(this.getItemViews(), _.bind(function(view) {
                        setImmediate(function() { // defer to prevent UI blocking
                            view.show(true);
                        });
                    }, this));
                } else {
                    // set & apply new filter
                    this.filter = filter;
                    _.each(this.getItemViews(), _.bind(function(view) {
                        filter.liveMatch(view.model, true, function(model, newMatchResult) {
                            setImmediate(function() { // defer to prevent UI blocking
                                view.show(newMatchResult); // hide or show the view based on the filter result
                            });
                        });
                    }, this));
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
            Chaplin.CollectionView.prototype.render.apply(this, arguments);

            // recupera il contenitore con gli el delle viste degli item per reinserirlo poi,
            // infatti tali el vengono aggiunti/rimossi a parte in base agli eventi della collezione,
            // in modo da non doverli riappendere tutti da capo ad ogni render,
            // ciò diminuisce drasticamente l'uso della cpu che altrimenti si fa sentire in caso di
            // molti add ravvicinati (causati dall'aggiornamento in tempo reale)
            var collectionEl = this.$(this.listSelector);

            var thereAreItems = (this.collectionItemViews.length!==0);
            this.el.innerHTML = this.template({thereAreItems: thereAreItems}); // NON usare this.$el.html() che disattiva gli event handler jquery delle sottoviste esistenti
            // reinserisce il contenitore con gli el delle viste (se applicabile)
            if (thereAreItems && collectionEl.length > 0) {
                var placeholderCollectionEl = this.$(this.listSelector);
                placeholderCollectionEl.replaceWith(collectionEl);
            }

            return this;
        }
    });
    return CollectionView;
});
