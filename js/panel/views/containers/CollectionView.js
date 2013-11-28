/* Vista per una collezione, crea una sottovista per ogni item (modello) della collezione.
   Nota: la collezione deve supportare l'aggiornamento in tempo reale e può essere passata
   anche direttamente nel costruttore (grazie a Backbone.View).
   VINCOLO: se all'atto della render ci sono item, il template deve stampare il collectionEl
            (l'elemento che contiene gli el delle viste degli item), 
            ciò è necessario per il funzionamento della gestione separata di tale collectionEl
            (vedi metodo render). */

define(["backbone", "underscore", "jquery", "handlebars"],
function(Backbone, _, $, Handlebars) {

    var AppComponentsView = Backbone.View.extend({

        template: undefined,

        CollectionItemView: undefined, // tipo vista di un item
        collectionElSelector: undefined, // selettore per l'elemento html che contiene gli el delle viste degli item

        initialize: function(options) {
            _.bindAll(this);

            // array con una vista per ogni item
            this.collectionItemViews = [];

            // recupera item correnti
            this.collection.fetch(_.bind(function() { // on complete
                _.defer(_.bind(function() { // needed to handle the fetch after pending deferred adds
                    // gestisce i nuovi item
                    this.clearItems();
                    this.render();
                    for (var i=0,l=this.collection.length; i<l; i++) {
                        var collectionItem = this.collection.at(i);
                        this.handleNewItem(collectionItem);
                    }
                }, this));
            }, this));

            // handle new items
            this.listenTo(this.collection, "add", this.handleNewItem);

            this.render();
        },

        // Resetta l'array delle viste degli item
        // N.B: la render NON verrà chiamata!
        clearItems: function() {
            for (var i=0; i<this.collectionItemViews.length; i++) {
                var collectionItemView = this.collectionItemViews[i];
                collectionItemView.remove();
            };
            this.collectionItemViews = [];
        },

        // Aggiunge l'elemento e lo visualizza nel DOM
        handleNewItem: function(collectionItem) {
            // don't move the indexOf calculation inside the defer or we'll have an invalid value if
            // other new items are prepended during the waiting time
            var collectionItemIndex = this.collection.indexOf(collectionItem);
            _.defer(_.bind(function() { // prevents UI blocking
                var newCollectionItemView = this.addItem(collectionItem, collectionItemIndex);
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

        render: function() {
            // recupera il contenitore con gli el delle viste degli item per reinserirlo poi,
            // infatti tali el vengono aggiunti/rimossi a parte in base agli eventi della collezione,
            // in modo da non doverli riappendere tutti da capo ad ogni render,
            // ciò diminuisce drasticamente l'uso della cpu che altrimenti si fa sentire in caso di
            // molti add ravvicinati (causati dall'aggiornamento in tempo reale)
            var collectionEl = this.$(this.collectionElSelector);

            var thereAreItems = (this.collectionItemViews.length!==0);
            this.el.innerHTML = this.template({thereAreItems: thereAreItems}); // NON usare this.$el.html() che disattiva gli event handler jquery delle sottoviste esistenti
            // reinserisce il contenitore con gli el delle viste (se applicabile)
            if (thereAreItems && collectionEl.length > 0) {
                var placeholderCollectionEl = this.$(this.collectionElSelector);
                placeholderCollectionEl.replaceWith(collectionEl);
            }

            return this;
        }
    });
    return AppComponentsView;
});
