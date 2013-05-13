/* Vista per una collezione.
   Note: la collezione deve supportare l'aggiornamento in tempo reale e può essere passata
   anche direttamente nel costruttore (grazie a Backbone.View).*/

define(["backbone", "underscore", "jquery", "handlebars"],
function(Backbone, _, $, Handlebars) {
	
	var AppComponentsView = Backbone.View.extend({

		template: undefined,

		CollectionItemView: undefined, // tipo delle viste per i modelli contenuti nella collezione
		collectionElSelector: undefined, // selettore per l'elemento html che contiene gli elementi della collezione 

		initialize: function(options) {
			_.bindAll(this);

			// array con una vista per ogni modello della collezione (ogni istanza ha il suo)
			this.collectionItemViews = [];

			// recupera modelli correnti della collezione
			this.collection.fetch(_.bind(function() { // on complete
				// resetta l'array delle viste
				this.forEachItemView(_.bind(function(collectionItemView) {
					collectionItemView.remove();
				}, this));
				this.collectionItemViews = [];
				// crea le viste per i nuovi modelli
				for (var i=0,l=this.collection.length; i<l; i++) {
					var collectionItem = this.collection.at(i);
					this.collectionItemViews.push(new this.CollectionItemView({
						model: collectionItem
					}));
				}
				this.render();
			}, this));

			// si mette in ascolto per i nuovi modelli creati
			this.listenTo(this.collection, "add", _.bind(function(collectionItem) {
				// nuovo elemento!
				var itemIndexInCollection = this.collection.indexOf(collectionItem);
				if (this.collectionItemViews[itemIndexInCollection]) {
					// cancella la vecchia vista
					this.collectionItemViews[itemIndexInCollection].remove();
				}
				this.collectionItemViews[itemIndexInCollection] = new this.CollectionItemView({
					model: collectionItem
				});
				this.render();
			}, this));

			this.render();
		},

		// Nota bene: il metodo è sincrono!
		// handleItem viene chiamata per ogni elemento passandogli l'elemento, il suo indice
		// e l'array con tutte le viste.
		// L'iterazione di default è dal primo all'ultimo elemento, ma i sottotipi possono sovrascrivere
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
			var thereAreItems = (this.collectionItemViews.length!==0);

			this.el.innerHTML = this.template({thereAreItems: thereAreItems}); // NON usare this.$el.html() che disattiva gli event handler jquery delle sottoviste esistenti
			//this.$el.html(this.template({thereAreItems: thereAreItems}));
			if (thereAreItems) {
				// inserisce le viste per i modelli della collezione
				var collectionEl = this.$(this.collectionElSelector);
				this.forEachItemView(_.bind(function(collectionItemView) {
					collectionEl.append(collectionItemView.el);
				}, this));
			}

			return this;
		}
    });
    return AppComponentsView;
});