/* L'aggiornamento in tempo reale viene attivato automaticamente al termine della fetch. */

define(["backbone", "underscore"],
function(Backbone, _) {

    var Collection = Backbone.Collection.extend({

        isRealTimeUpdateActive: false,

        initialize: function(models, options) {
            _.bindAll(this);
        },

        // restituisce un nuovo modello (con l'indice settato)
        createModel: undefined, // abstract function(modelIndex)

        // funzione che chiama onComplete passandogli
        // un array con gli indici dei modelli correntemente presenti.
        fetchModelsIndexes: undefined, // abstract function(onComplete)

        // used to exclude late real time updates, i.e. updates sent from the inspected page 
        // before the last fetch but handled after it (updates are asynchronous)
        lastFetchTimestamp: undefined,

        // resetta la collezione con i componenti correnti dell'app, 
        // chiama onComplete al termine dell'operazione.
        // N.B: l'operazione termina dopo aver effettuato il fetch di tutti i modelli recuperati.
        fetch: function(onComplete) {
            var fetchComplete = _.bind(function(models) {
                this.reset(models);
                this.realTimeUpdate(); // ora ha senso avviare l'aggiornamento in tempo reale
                if (onComplete !== undefined) onComplete();
            }, this);

            this.fetchModelsIndexes(_.bind(function(modelsIndexes) { // on complete
                this.lastFetchTimestamp = Date.now();

                if (modelsIndexes.length == 0) {
                    // no models
                    fetchComplete([]);
                    return;
                }

                // there are models
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
                            fetchComplete(models);
                        }

                    }, this));
                }
            }, this));
        },

        // logica della realTimeUpdate, ogni volta che viene rilevato un nuovo modello,
        // chiama la onNew passandogli l'indice del modello e il timestamp della data di creazione.
        realTimeUpdateLogic: undefined, // function(onNew)

        // aggiorna la collezione in tempo reale a seconda dei report inviati dall'agent
        realTimeUpdate: function() {
            // previene l'attivazione multipla della real time update
            // (per evitare che la logica venga eseguita più di una volta)
            if (this.isRealTimeUpdateActive) return;

            this.realTimeUpdateLogic(_.bind(function(modelIndex, creationTimestamp) { // on new
                if (creationTimestamp < this.lastFetchTimestamp) {
                    // this model was already caught by the last fetch, don't duplicate it
                    return;
                }
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