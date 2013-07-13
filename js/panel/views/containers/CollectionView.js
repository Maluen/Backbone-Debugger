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
                // crea le viste per i nuovi item
                this.clearItems();
                for (var i=0,l=this.collection.length; i<l; i++) {
                    var collectionItem = this.collection.at(i);
                    this.addItem(collectionItem);
                }
                this.render(); // la render è fatta prima in modo da aver accesso al collectionEl se ci sono item!
                // popola il collectionEl
                var collectionEl = this.$(this.collectionElSelector);
                if (collectionEl.length > 0) {
                    this.forEachItemView(_.bind(function(collectionItemView) {
                        collectionEl.append(collectionItemView.el);
                    }, this));
                }
            }, this));

            // si mette in ascolto per i nuovi item creati
            this.listenTo(this.collection, "add", _.bind(function(collectionItem) {
                // nuovo item!
                var newCollectionItemView = this.addItem(collectionItem);
                // la render è fatta prima in modo da aver accesso al collectionEl 
                // (e aggiornare eventuali altre infomazioni del template, ad es. uno span con il numero di item)
                this.render();
                // aggiunge al collectionEl l'el per la vista del nuovo item alla posizione corretta
                var collectionEl = this.$(this.collectionElSelector);
                if (collectionEl.length > 0) {
                    var collectionItemViewLeftSibling;
                    this.forEachItemView(_.bind(function(collectionItemView) {
                        if (collectionItemView === newCollectionItemView) {
                            if (collectionItemViewLeftSibling) {
                                // inserisce l'el dopo il vicino sinistro
                                newCollectionItemView.$el.insertAfter(collectionItemViewLeftSibling.$el);
                            } else {
                                // non ha un vicino sinistro => primo el
                                collectionEl.prepend(collectionItemView.el);
                            }
                        } else {
                            // nuovo candidato a vicino sinistro
                            collectionItemViewLeftSibling = collectionItemView;
                        }
                    }, this));
                }
            }, this));

            this.render();
        },

        // Resetta l'array delle viste degli item
        // N.B: la render NON verrà chiamata!
        clearItems: function() {
            this.forEachItemView(_.bind(function(collectionItemView) {
                collectionItemView.remove();
            }, this));
            this.collectionItemViews = [];
        },

        // Crea un nuova vista per l'item e la restituisce.
        // N.B: la render NON verrà chiamata!
        addItem: function(collectionItem) {
            var collectionItemView = new this.CollectionItemView({
                model: collectionItem
            });
            this.collectionItemViews.push(collectionItemView);
            return collectionItemView;
        },

        // N.B: il metodo è sincrono!
        // handleItemView viene chiamata per ogni item view passandoglela insieme al suo indice
        // e all'array con tutte le viste degli item.
        // L'iterazione di default è dal primo all'ultimo item, ma i sottotipi possono sovrascrivere
        // il metodo per modificarne il funzionamento.
        // Il metodo è stato creato principalmente per rendere flessibile l'ordine di visualizzazione 
        // delle viste nella render.
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
