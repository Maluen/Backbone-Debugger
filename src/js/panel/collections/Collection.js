/* L'aggiornamento in tempo reale viene attivato automaticamente in fase di inizializzazione. */

define(["backbone", "underscore"],
function(Backbone, _) {

	var Collection = Backbone.Collection.extend({

		isRealTimeUpdateActive: false,

		initialize: function(models, options) {
			_.bindAll(this);

			this.realTimeUpdate();
		},

		// restituisce un nuovo modello (con l'indice settato)
		createModel: undefined, // abstract function(modelIndex)

		// funzione che chiama onComplete passandogli
		// un array con gli indici dei modelli correntemente presenti.
		fetchModelsIndexes: undefined, // abstract function(onComplete)

		// resetta la collezione con i componenti correnti dell'app, 
		// chiama onComplete al termine dell'operazione.
		// N.B: l'operazione termina dopo aver effettuato il fetch di tutti i modelli recuperati.
		fetch: function(onComplete) {
			this.fetchModelsIndexes(_.bind(function(modelsIndexes) { // on complete
				var models = [];
				var fetchedModels = 0;
				for (var i=0,l=modelsIndexes.length; i<l; i++) {
					var model = this.createModel(modelsIndexes[i]);
					models.push(model);
					// fa il fetch del modello
					model.fetch(_.bind(function() { // on complete
						fetchedModels++;
						if (fetchedModels === modelsIndexes.length) {
							// fetch di tutti i modelli completato
							this.reset(models);
							if (onComplete !== undefined) onComplete();
						}

					}, this));
				}
			}, this));
		},

		// logica della realTimeUpdate, ogni volta che viene rilevato un nuovo modello,
		// chiama la onNew passandogli l'indice del modello.
		realTimeUpdateLogic: undefined, // function(onNew)

		// aggiorna la collezione in tempo reale a seconda dei report inviati dall'agent
		realTimeUpdate: function() {
			// previene l'attivazione multipla della real time update
			// (per evitare che la logica venga eseguita più di una volta)
			if (this.isRealTimeUpdateActive) return;

			this.realTimeUpdateLogic(_.bind(function(modelIndex) { // on new
				// nuovo modello! lo aggiunge alla collezione solo dopo averne fatto il fetch
				var model = this.createModel(modelIndex);
				model.fetch(_.bind(function() { // on complete
					this.push(model);
				}, this));
			}, this));

			this.isRealTimeUpdateActive = true;
		}
    });
    return Collection;
});