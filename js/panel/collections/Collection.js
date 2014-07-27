define(["backbone", "underscore"],
function(Backbone, _) {

    var Collection = Backbone.Collection.extend({

        initialize: function(models, options) {
            _.bindAll(this);
        },

        // returns a new model (with the index setted)
        createModel: undefined, // abstract function(modelIndex)

        isLoadInProgress: false,
        // onComplete callback passed to loadMore, stored so to be able to call it even after loading
        // remaining models via realtime update
        loadMoreOnComplete: undefined,

        loadStartIndex: 0, // index from which to start getting models 
        loadLength: 5, // number of models to get on each call

        // function that calls onComplete with an array containing the indexes of the retrieved models.
        loadModelsIndexes: undefined, // abstract function(loadStartIndex, loadLength, onComplete)

        loadLeft: 0, // number of models still to get via realtime update so to reach the length
        isRealTimeUpdateActive: false,

        // adds to the collection more models, as retrieved by the loadModelsIndexes function,
        // calls onComplete at the end of the operation, optionally by getting some of them via realtime update
        // if the number requested isn't immediately available.
        // Note: the operation ends after having fetched all the retrieved models.
        loadMore: function(onComplete) {
            if (this.isLoadInProgress) return; // no multiple loads
            this.isLoadInProgress = true;

            this.loadMoreOnComplete = onComplete;

            var loadComplete = _.bind(function(models) {
                this.add(models);

                this.loadStartIndex += models.length;
                this.loadLeft = this.loadLength - models.length;
                if (this.loadLeft == 0) {
                    this.isLoadInProgress = false;
                    if (onComplete !== undefined) onComplete();
                } else {
                    // get the rest via realtime update (it will mark the load as finished when done)
                    this.startRealTimeUpdate();
                }
            }, this);

            this.loadModelsIndexes(_.bind(function(modelsIndexes) { // on complete
                if (modelsIndexes.length === 0) {
                    // no models
                    loadComplete([]);
                    return;
                }

                // there are models, fetch them
                var models = [];
                var fetchedModels = 0;
                for (var i=0,l=modelsIndexes.length; i<l; i++) {
                    var model = this.createModel(modelsIndexes[i]);
                    models.push(model);
                    model.fetch(_.bind(function() { // on complete
                        fetchedModels++;
                        if (fetchedModels === modelsIndexes.length) {
                            // fetch of all the models completed
                            loadComplete(models);
                        }

                    }, this));
                }
            }, this));
        },

        // logica della startRealTimeUpdate, ogni volta che viene rilevato un nuovo modello,
        // chiama la onNew passandogli l'indice del modello e il timestamp della data di creazione.
        // Note: the created listener must be saved into this.realTimeUpdateListener
        // so to stop realtime update when needed.
        startRealTimeUpdateLogic: undefined, // function(onNew)        
        realTimeUpdateListener: undefined, // array with Backbone listenTo parameters. 

        // aggiorna la collezione in tempo reale a seconda dei report inviati dall'agent
        startRealTimeUpdate: function() {
            // previene l'attivazione multipla della real time update
            // (per evitare che la logica venga eseguita più di una volta)
            if (this.isRealTimeUpdateActive) return;

            this.startRealTimeUpdateLogic(_.bind(function(modelIndex, creationTimestamp) { // on new
                if (creationTimestamp < this.lastFetchTimestamp) {
                    // this model was already caught by the last fetch, don't duplicate it
                    return;
                }
                // nuovo modello! lo aggiunge alla collezione solo dopo averne fatto il fetch
                var model = this.createModel(modelIndex);
                model.fetch(_.bind(function() { // on complete
                    this.add(model);

                    this.loadStartIndex++;
                    this.loadLeft--;
                    // check if we getted all the models of the current load
                    if (this.loadLeft == 0) {
                        this.stopRealTimeUpdate();
                        this.isLoadInProgress = false;
                        if (this.loadMoreOnComplete) this.loadMoreOnComplete();
                    }
                }, this));
            }, this));

            this.isRealTimeUpdateActive = true;
        },

        stopRealTimeUpdate: function() {
            if (this.realTimeUpdateListener) this.stopListening.apply(this, this.realTimeUpdateListener);
            this.isRealTimeUpdateActive = false;
        }
    });
    return Collection;
});
