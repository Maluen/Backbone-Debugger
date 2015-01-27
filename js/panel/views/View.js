define(["backbone", "underscore", "jquery"], function(Backbone, _, $) {

    var View = Backbone.View.extend({

        initialize: function(options) {
            _.bindAll(this);

            this.domListeners = [];
        },

        // true to show, false to hide
        show: function(showOrHide) {
            this.$el.toggle(showOrHide);
            
            if (showOrHide) {
                this.trigger('show');
            } else {
                this.trigger('hide');
            }
        },

        isShown: function() {
            // might be true also if the parent is hidden, differently from jquery ".is(':visible')"
            return this.$el.css('display') != 'none';
        },

        // return a function
        // that calls the passed DOM event handler and stops immediate propagation,
        // needed for keeping the event from bubbling up to parent views,
        // otherwise it could be handled by them too
        // (is the case if the parent view has the same type)
        // Set passEvent to false to call the handler without passing the event object.
        localHandler: function(domEventHandler, passEvent) {
            passEvent = passEvent || true;

            if (typeof domEventHandler == 'string') {
                domEventHandler = this[domEventHandler];
            }

            var self = this;
            return function(e) {
                e.stopPropagation();
                
                // (returned to prevent default if handler returns false)
                return domEventHandler.call(self, passEvent ? e : undefined);
            };
        },

        // A wrapper for $el.on(eventName, handler) that adds garbage management:
        // the event is unbinded automatically on view remove; the user can
        // also remove it manually by passing the returned index to stopDOMListening.
        // It is useful for binding events to elements like $(window), $(document)
        // and generally everything that is outside the Backbone.View events hash.
        // Note: the handler is automatically bound to the view.
        listenToDOM: function($el, eventName, handler) {
            handler = _.bind(handler, this);

            $el.on(eventName, handler);
            var domListener = [$el, eventName, handler];
            var domListenerIndex = this.domListeners.length;
            this.domListeners.push(domListener);
            return domListenerIndex;
        },

        stopDOMListening: function(domListenerIndex) {
            var domListener = this.domListeners[domListenerIndex];
            if (!domListener) return;

            var $el = domListener[0],
                eventName = domListener[1],
                handler = domListener[2];

            $el.off(eventName, handler);

            delete this.domListeners[domListenerIndex];
        },

        clearDOMListeners: function() {
            for (var i=0,l=this.domListeners.length; i<l; i++) {
                this.stopDOMListening(i);
            }
            this.domListeners = [];
        },

        remove: function() {
            this.clearDOMListeners();

            Backbone.View.prototype.remove.apply(this, arguments);
        }

    });
    return View;
});
