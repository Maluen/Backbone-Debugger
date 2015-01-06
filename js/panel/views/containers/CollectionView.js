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
            View.prototype.initialize.apply(this, arguments);

            // array con una vista per ogni item
            this.collectionItemViews = [];

            this.listenTo(this.collection, "add", this.handleNewItem);

            this.start();
        },

        start: function(onStarted) {
            this.collection.start(_.bind(function() { // on started
                this.render();
                this.started = true;
                if (onStarted) onStarted();
            }, this));
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

        // Crea un nuova vista per l'item e la restituisce.
        // N.B: la render NON verrà chiamata!
        // Note: collectionItemIndex is different from collectionItem.item
        // since the former is the position in the collection
        // (a filtered collection could show only 1 model with index 34)
        // TODO: refactor the above naming to make it more clear
        addItem: function(collectionItem, collectionItemIndex) {
            var collectionItemView = new this.CollectionItemView({
                model: collectionItem
            });
            this.collectionItemViews.splice(collectionItemIndex, 0, collectionItemView);

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
                setImmediate(function() { // defer to prevent UI blocking
                    collectionItemView.show(false);
                });
            }, this));

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

        templateData: function() {
            return {
                thereAreItems: this.collectionItemViews.length!==0
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
