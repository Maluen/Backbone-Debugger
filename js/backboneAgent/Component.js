// Simple component with extend and events capabilities.

Modules.set('Component', function() {
    // imports
    var u = Modules.get('utils');

    // constructor
    var Component = function() { 
        if (typeof this.initialize == 'function') {
            this.initialize.apply(this, arguments); 
        }
    };

    Component.extend = function(ChildProperties) {

        var Super = this; // (the Component itself or the subtype we are extending)

        var Child;

        // child constructor
        if (ChildProperties.hasOwnProperty('constructor')) {
            // custom constructor
            Child = ChildProperties.constructor;
        } else {
            // default constructor
            Child = function() {
                Super.apply(this, arguments);
            }
        }

        u.extend(Child, Super); // for static properties
        Child.prototype = Object.create(Super.prototype);
        Child.prototype.__Super = Super;
        Child.prototype.__super = Super.prototype;
        u.extend(Child.prototype, ChildProperties);

        return Child;
    }

    u.extend(Component.prototype, {

        on: function(eventName, callback, context) {
            if (!this._eventHandlers) this._eventHandlers = {}; // hash <eventName, [handlers]>
            if (!this._eventHandlers[eventName]) this._eventHandlers[eventName] = [];
            this._eventHandlers[eventName].push({
                callback: callback,
                context: context
            });
        },

        off: function(eventName, callback, context) {
            if (!this._eventHandlers) return;

            u.each(this._eventHandlers, function(handlers, currentEventName) {
                var areHandlersAffected = (eventName == undefined || currentEventName === eventName);
                if (areHandlersAffected) {
                    for (var i=0; i<handlers.length; i++) { // no length cache, it might change
                        var handler = handlers[i];

                        var isHandlerAffected = (callback == undefined || handler.callback === callback) &&
                                                (context == undefined || handler.context === context);
                        if (isHandlerAffected) {
                            // remove handler
                            handlers.splice(i, 1);
                            i--;
                        } 
                    }
                    if (handlers.length == 0) {
                        delete this._eventHandlers[currentEventName];
                    }
                }
            }, this);
        },

        listenTo: function(other, eventName, callback) {
            other.on(eventName, callback, this);

            if (!this._listeners) this._listeners = [];
            this._listeners.push({
                other: other, 
                eventName: eventName, 
                callback: callback
            });
        },

        stopListening: function(other, eventName, callback) {
            if (!this._listeners) return;

            for (var i=0; i<this._listeners.length; i++) { // no length cache, it might change
                var listener = this._listeners[i];
                var isAffected = (other == undefined || listener.other === other) &&
                                 (eventName == undefined || listener.eventName === eventName) &&
                                 (callback == undefined || listener.callback === callback);
                if (isAffected) {
                    listener.other.off(listener.eventName, listener.callback, this);
                    this._listeners.splice(i, 1);
                    i--;
                }
            }
        },

        trigger: function(eventName /*, arg1, ... , argN */) {
            if (!this._eventHandlers) return;

            var eventArguments = Array.prototype.slice.call(arguments, 1); // from second argument

            var handlers = this._eventHandlers[eventName];
            this.callEventHandlers(handlers, eventArguments);

            // also emit an 'all' event
            var handlers = this._eventHandlers['all'];
            this.callEventHandlers(handlers, [eventName].concat(eventArguments));
        },

        callEventHandlers: function(handlers, eventArguments) {
            if (!handlers) return;

            for (var i=0; i<handlers.length; i++) {
                var handler = handlers[i];
                handler.callback.apply(handler.context, eventArguments);
            }
        },

        remove: function() {
            this.stopListening();
        }

    });

    return Component;
});