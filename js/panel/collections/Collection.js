define(["backbone", "underscore", "backboneAgentClient"],
function(Backbone, _, backboneAgentClient) {

    var Collection = Backbone.Collection.extend({

        initialize: function(models, options) {
            _.bindAll(this);
        },

        // the user should wait this to become true
        // before requesting data from the collection
        started: false,

        // returns a new model (with the index setted)
        createModel: undefined, // abstract function(modelIndex)

        // index of the associated agent Reader instance for the remote collection
        readerIndex: undefined,

        isReadInProgress: false,
        // onComplete callback passed to readMore, stored so to be able to call it even after reading
        // remaining models via realtime update
        readMoreOnComplete: undefined,

        readStartIndex: 0, // index from which to start getting models 
        readLength: 5, // number of models to get on each call

        // function that calls onComplete with an array containing the indexes of the retrieved models.
        readModelsIndexes: undefined, // abstract function(readStartIndex, readLength, onComplete)

        readLeft: 0, // number of models still to get via realtime update so to reach the length
        isRealTimeUpdateActive: false,

        // connects the collection with the agent endpoint
        start: function(onStarted) {
            var url = (typeof this.url == 'function') ? this.url() : this.url;

            // register reader
            backboneAgentClient.execFunction(function(clientIndex, collectionUrl) {
                var collection = this.database.get(collectionUrl);
                var reader = new this.Reader(collection);
                var dedicatedServer = this.server.getDedicatedServer(clientIndex);
                var readerIndex = dedicatedServer.registerReader(reader);
                return readerIndex;
            }, [backboneAgentClient.clientIndex, url], _.bind(function(readerIndex) {
                this.readerIndex = readerIndex;
                this.started = true;
                if (onStarted) onStarted();
            }, this));
        },

        // adds to the collection more models, as retrieved by the readModelsIndexes function,
        // calls onComplete at the end of the operation, optionally by getting some of them via realtime update
        // if the number requested isn't immediately available.
        // Note: the operation ends after having fetched all the retrieved models.
        readMore: function(onComplete) {
            if (this.isReadInProgress) return; // no multiple reads
            this.isReadInProgress = true;

            this.readMoreOnComplete = onComplete;

            var readComplete = _.bind(function(models) {
                this.add(models);

                this.readStartIndex += models.length;
                this.readLeft = this.readLength - models.length;
                if (this.readLeft == 0) {
                    this.isReadInProgress = false;
                    if (onComplete !== undefined) onComplete();
                } else {
                    // get the rest via realtime update (it will mark the read as finished when done)
                    this.startRealTimeUpdate();
                }
            }, this);

            this.readModelsIndexes(_.bind(function(modelsIndexes) { // on complete
                if (modelsIndexes.length === 0) {
                    // no models
                    readComplete([]);
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
                            readComplete(models);
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

                    this.readStartIndex++;
                    this.readLeft--;
                    // check if we getted all the models of the current read
                    if (this.readLeft == 0) {
                        this.stopRealTimeUpdate();
                        this.isReadInProgress = false;
                        if (this.readMoreOnComplete) this.readMoreOnComplete();
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
