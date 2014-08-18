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
        Child.prototype.__super = Super;
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
        }

    });

    return Component;
});