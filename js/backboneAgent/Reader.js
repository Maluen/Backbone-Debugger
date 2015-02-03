// Read a collection

Modules.set('Reader', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');

    var Reader = Component.extend({

        // setted by the reader manager (the dedicated server) on registration
        index: undefined,

        // the collection to read
        collection: undefined,

        // if the collection must be read in reverse order, e.g. from end to start
        orderReverse: false,

        // the filter to use on the collection
        filter: undefined,

        initialize: function(collection, orderReverse) {
            this.collection = collection;
            if (typeof orderReverse !== 'undefined') { // otherwise keep default
                this.orderReverse = orderReverse;
            }

            this.readListeners = [];
            this.isReadMoreInProgress = false;
            this.readMoreLeft = 0;

            this.lastUnfilteredIndex = undefined;

            // inizialize position from which to read the collection (depends on the order type)
            this.position = undefined;
            this.begin();

            this.readNewModels();
        },

        moveTo: function(position) {
            if (position >= 0 && position < this.collection.length) {
                this.position = position;
                return this.collection.at(position);
            }
        },

        next: function() {
            return this.moveTo(this.orderReverse? this.position-1 : this.position+1);
        },

        prev: function() {
            return this.moveTo(this.orderReverse? this.position+1 : this.position-1);
        },

        first: function() {
            return this.moveTo(this.orderReverse? this.collection.length-1 : 0);
        },

        last: function() {
            return this.moveTo(this.orderReverse? 0 : this.collection.length-1);
        },

        current: function() {
            return this.collection.at(this.position);
        },

        beginPosition: function() {
            return (this.orderReverse) ? this.collection.length : -1;
        },

        begin: function() {
            this.position = this.beginPosition();

            // reset everything, this is a new begin!
            this.lastUnfilteredIndex = undefined;
            this.unreadAll();
            this.readMoreFinished();

            this.send('begin');
        },

        setOrderReverse: function(orderReverse) {
            if (this.orderReverse != orderReverse) {
                this.orderReverse = orderReverse;
                this.begin();
            }
        },

        // pass falsy value for no filter.
        // Note: the reader takes ownership of the filter,
        // i.e. will remove it when not needed anymore.
        setFilter: function(filter) {
            // remove old filter
            if (this.filter) this.filter.remove();

            if (!this.filter && filter) {
                // no filter -> filter
                // => calculate last visible index
                // (is the current since all the models are visible)
                var current = this.current();
                this.lastUnfilteredIndex = current? current.index : undefined;
            } else if (this.filter && !filter) {
                // filter -> no filter
                // => restore previous models
                // (after a filter is setted, the user could have read many hidden models,
                // thus in order to avoid their massive showing when removing the filter,
                // we only reshow the models that were visible before having any filter)
                var current = this.current();
                while (current && current.index !== this.lastUnfilteredIndex) {
                    this.unread();
                    this.visibilityChange(current, false); // signal model as hidden (TODO: generalize this directly in unreadModel?)
                    current = this.prev();
                }
                if (!current) {
                    // index not found, but reader now is actually at first position,
                    // even though we have unread the first model, so subsequent read more would
                    // never read it again, thus we manually move into the begin position
                    this.position = this.beginPosition();
                }
                // an eventual pending read more is not valid anymore
                this.readMoreFinished();
            }

            // set new filter
            this.filter = filter;

            // check new visibility with new filter
            for (var i=0, l=this.readListeners.length; i<l; i++) {
                if (this.readListeners[i]) { // (the array might be sparse!)
                    var model = this.collection.at(i);
                    this.readModel(model);
                }
            }
        },

        readNewModels: function() {
            // Note: assumes model is not added in middle position!
            this.listenTo(this.collection, 'add', function(model) {
                // an add is relevant if:
                // - in reverse mode: always (model is on top)
                // - in normal mode: when there are still models left to read
                var isRelevant = this.orderReverse || this.isReadMoreInProgress;
                if (isRelevant) {

                    if (!this.orderReverse && this.isReadMoreInProgress && this.position === this.collection.length-2) {
                        // we were at the end waiting for new models => 
                        // the model must be 'consumed' or subsequents
                        // readMore will read it again
                        this.next();
                    } else if (this.orderReverse && this.position === this.collection.length-1) {
                        // we were at this.collection.length before the model was added, i.e.
                        // we just begun => keep the position
                        this.position = this.collection.length;
                    }

                    // process model
                    var passes = this.readModel(model);
                    // if a read more is in progress and the model was actually added
                    // at the (relative) end, update the models left to read
                    // (never in reverse mode since the adds are done at the collection end,
                    // (i.e. at the relative start, that's intended.)
                    if (passes && !this.orderReverse && this.isReadMoreInProgress) {
                        this.readMoreLeft--;
                        if (this.readMoreLeft == 0) {
                            this.readMoreFinished();
                        }
                    }
                }
            });
        },

        // read 'howMany' passing models
        readMore: function(howMany) {
            if (this.isReadMoreInProgress) return;
            this.readMoreStarted();

            this.readMoreLeft = howMany;

            while (this.readMoreLeft != 0 && this.next()) {
                var passes = this.read();
                if (passes) this.readMoreLeft--;
            }

            if (this.readMoreLeft == 0) {
                this.readMoreFinished();
            } else {
                // read will finish after remaining models have been read via add events
                // (will never finish in reverse order since new models are actually
                // before the current position, that's intended to prevent infinite
                // client back and forth for new never-existing models)
            }
        },

        readMoreStarted: function() {
            if (!this.isReadMoreInProgress) {
                this.isReadMoreInProgress = true;
                this.send('readMoreStarted');
            }
        },

        readMoreFinished: function() {
            if (this.isReadMoreInProgress) {
                this.readMoreLeft = 0;
                this.isReadMoreInProgress = false;
                this.send('readMoreFinished');
            }
        },

        read: function() {
            var model = this.current();
            if (!model) return;
            return this.readModel(model);
        },

        readModel: function(model) {
            var modelIndex = model.index;
            if (this.readListeners[modelIndex]) {
                // already readed, unread it first
                this.unreadModel(model);
            }

            // initial visibility
            var passes = !this.filter || this.filter.match(model);
            this.visibilityChange(model, passes);

            // monitor visibility changes
            var listener = [model, 'change', function() {
                if (this.filter) {
                    var matchResult = this.filter.match(model);
                    if (matchResult != passes) {
                        passes = matchResult;
                        this.visibilityChange(model, matchResult);
                    }
                } else { // (needed if the filter has been removed)
                    if (!passes) {
                        passes = true;
                        this.visibilityChange(model, true);
                    }
                }
            }];
            this.listenTo.apply(this, listener);
            this.readListeners[modelIndex] = listener;

            return passes; // initial visibility
        },

        unread: function() {
            var model = this.current();
            if (!model) return;
            return this.unreadModel(model);
        },

        unreadModel: function(model) {
            var listener = this.readListeners[model.index];
            if (listener) {
                this.stopListening.apply(this, listener);
                delete this.readListeners[model.index];
            }
        },

        unreadAll: function() {
            for (var i=0, l=this.readListeners.length; i<l; i++) {
                var listener = this.readListeners[i];
                if (listener) { // (the array might be sparse!)
                    this.stopListening.apply(this, listener);
                    delete this.readListeners[i];
                }
            }
        },

        visibilityChange: function(model, isVisible) {
            this.send('visibilityChange', {
                modelIndex: model.index,
                isVisible: isVisible
            });
        },

        send: function(name, data) {
            this.trigger('send', name, data);
        }

    });

    return Reader;
});
