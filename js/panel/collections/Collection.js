define(["backbone", "underscore", "backboneAgentClient"],
function(Backbone, _, backboneAgentClient) {

    var Collection = Backbone.Collection.extend({

        initialize: function(models, options) {
            _.bindAll(this);

            // hash <model index, model>
            // (hash for efficiency reason, since an array could be very sparse!)
            this.hiddenModels = {};
            this.visibleModels = {};
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

        // Define the sorting logic: index order
        comparator: function(model) {
            return model.index;
        },

        isVisible: function(modelIndex) {
            return this.visibleModels[modelIndex] != undefined;
        },

        isHidden: function(modelIndex) {
            return this.hiddenModels[modelIndex] != undefined;
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

        // Note: an empty filter name means 'no filter'
        setFilter: function(name, options) {
            backboneAgentClient.execFunction(function(clientIndex, readerIndex, filterName, filterOptions) {
                var filter;
                if (filterName) {
                    var Filter = this.filters[filterName];
                    filter = new Filter(filterOptions);
                }

                var dedicatedServer = this.server.getDedicatedServer(clientIndex);
                var reader = dedicatedServer.getReader(readerIndex);
                reader.setFilter(filter);
            }, [backboneAgentClient.clientIndex, this.readerIndex, name, options]);
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

            var modelIndex = changeInfo.modelIndex,
                isVisible = changeInfo.isVisible,
                wasVisible = this.isVisible(modelIndex),
                wasHidden = this.isHidden(modelIndex),
                wasExisting = wasVisible || wasHidden;

            if (isVisible && wasHidden) {
                // hidden -> visible: show it
                var model = this.hiddenModels[modelIndex];
                this.onVisibleModel(model);

            } else if (isVisible && !wasExisting) {
                // not existing -> visible: create and show it
                this.onNewModel(modelIndex);

            } else if (!isVisible && wasVisible) {
                // visible -> hidden: hide it
                var model = this.visibleModels[modelIndex];
                this.onHiddenModel(model);
            }
        },

        // create and show the model
        onNewModel: function(modelIndex) {
            // add the model to the collection after having fetched it
            var model = this.createModel(modelIndex);
            model.fetch(_.bind(function() { // on complete
                this.add(model);
                this.onVisibleModel(model);
            }, this));
        },

        // the model passed from hidden to visible state
        onVisibleModel: function(model) {
            delete this.hiddenModels[model.index];
            this.visibleModels[model.index] = model;
            this.trigger('visible visible:'+model.index, model);
        },

        // the model passed from visible to hidden state
        onHiddenModel: function(model) {
            delete this.visibleModels[model.index];
            this.hiddenModels[model.index] = model;
            this.trigger('hidden hidden:'+model.index, model);
        }

    });
    return Collection;
});
