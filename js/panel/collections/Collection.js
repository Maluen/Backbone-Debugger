define(["backbone", "underscore", "backboneAgentClient"],
function(Backbone, _, backboneAgentClient) {

    var Collection = Backbone.Collection.extend({

        // the user should wait this to become true
        // before requesting data from the collection
        started: false,

        // returns a new model (with the index setted)
        createModel: undefined, // abstract function(modelIndex)

        // true for using reverse ordering by default
        orderReverse: false,

        // index of the associated agent Reader instance for the remote collection
        readerIndex: undefined,

        isReadInProgress: false,
        // onComplete callback passed to readMore, called after having read
        // models via realtime update
        readMoreOnComplete: undefined,

        // number of models to get on each readMore call
        readLength: 5,

        initialize: function(models, options) {
            _.bindAll(this);

            // default comparator
            this.updateComparator();

            // hash <model index, model>
            // (hash for efficiency reason, since an array could be very sparse!)
            this.hiddenModels = {};
            this.visibleModels = {};
            this.detachedModels = {};

            // number of models that are currently visible
            this.visibleModelsLength = 0;
        },

        // connects the collection with the agent endpoint
        start: function(onStarted) {
            var url = (typeof this.url == 'function') ? this.url() : this.url;

            // register reader
            backboneAgentClient.execFunction(function(clientIndex, collectionUrl, orderReverse) {
                var collection = this.database.get(collectionUrl);
                var reader = new this.Reader(collection, orderReverse);
                var dedicatedServer = this.server.getDedicatedServer(clientIndex);
                var readerIndex = dedicatedServer.registerReader(reader);
                return readerIndex;
            }, [backboneAgentClient.clientIndex, url, this.orderReverse], _.bind(function(readerIndex) {
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

        // Sorting logic: index order
        normalComparator: function(model) {
            return model.index;
        },

        // Sorting logic: reverse index order
        reverseComparator: function(model) {
            return -model.index;
        },

        // update used comparator based on used ordering
        updateComparator: function() {
            var comparator = this.orderReverse ? this.reverseComparator : this.normalComparator;
            this.comparator = comparator;
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

        setOrderReverse: function(orderReverse) {
            // local actions executed immediately since reader response messages (begin, etc.)
            // could come before the eval callback call

            this.orderReverse = orderReverse;
            this.updateComparator();
            // don't sort, the reader will send a begin event that will cause reset anyway

            backboneAgentClient.execFunction(function(clientIndex, readerIndex, orderReverse) {
                var dedicatedServer = this.server.getDedicatedServer(clientIndex);
                var reader = dedicatedServer.getReader(readerIndex);
                reader.setOrderReverse(orderReverse);
            }, [backboneAgentClient.clientIndex, this.readerIndex, orderReverse]);
        },

        readerEvents: {
            'readMoreFinished': 'handleReadMoreFinished',
            'visibilityChange': 'handleVisibilityChange',
            'begin': 'handleBegin'
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
            var model = this.createOrReuseModel(modelIndex);
            model.fetch(_.bind(function() { // on complete
                this.add(model);
                this.onVisibleModel(model);
            }, this));
        },

        createOrReuseModel: function(modelIndex) {
            var model;

            var detachedModel = this.detachedModels[modelIndex];
            if (detachedModel) {
                // exists in the detached view, reuse
                model = detachedModel;
                delete this.detachedModels[modelIndex]; // not detached anymore
            } else {
                model = this.createModel(modelIndex);
            }

            return model;
        },

        // the model passed from hidden to visible state
        onVisibleModel: function(model) {
            delete this.hiddenModels[model.index];
            this.visibleModels[model.index] = model;
            this.visibleModelsLength++;
            this.trigger('visible visible:'+model.index, model);
        },

        // the model passed from visible to hidden state
        onHiddenModel: function(model) {
            delete this.visibleModels[model.index];
            this.hiddenModels[model.index] = model;
            this.visibleModelsLength--;
            this.trigger('hidden hidden:'+model.index, model);
        },

        // this is a new begin!
        handleBegin: function() {
            // keep models for reusing them
            // (the same remote models will likely be requested again in the future)
            _.each(this.hiddenModels, function(model) {
                this.detachedModels[model.index] = model;
            }, this);
            _.each(this.visibleModels, function(model) {
                this.detachedModels[model.index] = model;
            }, this);

            this.hiddenModels = {};
            this.visibleModels = {};
            this.visibleModelsLength = 0;

            this.reset();
        }

    });
    return Collection;
});
