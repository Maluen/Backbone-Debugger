Modules.set('filters.Filter', function() {
    // imports
    var Component = Modules.get('Component');

    var Filter = Component.extend({

        initialize: function(options) {
            this.options = options || {};
        },

        // function(model, attributeName)
        // return boolean
        match: undefined,

        // If on is true, listen to the model change events in order to recheck the filter,
        // calling callback with the info if the result changes. Also immediately calls the callback 
        // with the initial result.
        // If on is false, deactivate the live check.
        liveMatch: function(model, on, callback) {
            if (on) {
                // activate
                var result = this.match(model);
                this.listenTo(model, "change", function() {
                    var newResult = this.match(model);
                    if (newResult != result) {
                        result = newResult;
                        callback(model, newResult);
                    }
                });
                callback(model, result);
            } else {
                // deactivate
                this.stopListening(model);
            }
        }

    });

    return Filter;
});