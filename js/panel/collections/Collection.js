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
        // onComplete callback passed to readMore, called after having read
        // models via realtime update
        readMoreOnComplete: undefined,

        // number of models to get on each readMore call
        readLength: 5,

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
                this.startRealTimeUpdate();
                this.started = true;
                if (onStarted) onStarted();
            }, this));
        },

        // setup the remote reader event handlers
        startRealTimeUpdate: function() {

            var clientIndex = backboneAgentClient.clientIndex;
            var prefix = 'backboneAgent:dedicatedServer:'+clientIndex
                       + ':reader:'+this.readerIndex+':';

            var events = typeof this.readerEvents == 'function' ?
                         this.readerEvents() : this.readerEvents;

            _.each(events || {}, function(eventHandler, eventName) {
                eventHandler = typeof eventHandler == 'string' ?
                                this[eventHandler] : eventHandler;

                this.listenTo(backboneAgentClient, prefix+eventName, 
                            _.bind(eventHandler, this));
            }, this);
        },

        // read models from the remote collection by using the associated Reader,
        // calls onComplete at the end of the operation.
        readMore: function(onComplete) {
            if (this.isReadInProgress) return; // no multiple reads
            this.isReadInProgress = true;
            this.readMoreOnComplete = onComplete;

            backboneAgentClient.execFunction(function(clientIndex, readerIndex, readLength) {
                var dedicatedServer = this.server.getDedicatedServer(clientIndex);
                var reader = dedicatedServer.getReader(readerIndex);
                reader.readMore(readLength);
            }, [backboneAgentClient.clientIndex, this.readerIndex, this.readLength]);
        },

        readerEvents: {
            'readMoreFinished': 'handleReadMoreFinished',
            'visibilityChange': 'handleVisibilityChange'
        },

        handleReadMoreFinished: function() {
            this.isReadInProgress = false;
            if (this.readMoreOnComplete) this.readMoreOnComplete();
        },

        handleVisibilityChange: function(event) {
            var changeInfo = event.data;

            // TODO: for now we only have adds (no remote filters)
            this.onNewModel(changeInfo.modelIndex);
        },

        onNewModel: function(modelIndex) {
            // add the model to the collection after having fetched it
            var model = this.createModel(modelIndex);
            model.fetch(_.bind(function() { // on complete
                this.add(model);
            }, this));
        }

    });
    return Collection;
});
