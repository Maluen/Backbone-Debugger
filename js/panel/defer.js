// Small library for splitting cpu intensive javascript code into small chunks 
// in order to not block the user interface.

define(["underscore"], function(_) {
    var defer = new (function() {

        this.initialize = function() {
            _.bindAll(this);

            this.queue = [];
        };

        this.add = function(func) {
            this.queue.push(func);
            if (this.queue.length == 1) {
                // do first
                setTimeout(this.doNext, 0);
            }
        };

        this.doNext = function() {
            var next = this.queue.shift();
            next();
            if (this.queue.length !== 0) {
                // do next
                setTimeout(this.doNext, 0);
            }
        };

        this.initialize();
    })();
    return defer;
});
