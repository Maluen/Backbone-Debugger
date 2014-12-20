Modules.set('collections.Collection', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');

    var Collection = Component.extend({

        constructor: function(models) {
            this.models = models || [];
            this.length = this.models.length;

            this.initialize.apply(this, arguments);
        },

        // add the model instance to the collection
        add: function(model) {
            this.models.push(model);
            this.length = this.models.length;

            // re-trigger any model event
            this.listenTo(model, 'all', function(eventName /*, arg1, ... , argN */) {
                this.trigger.apply(this, arguments);
            });

            this.trigger('add', model, this);
        },

        at: function(index) {
            return this.models[index];
        }

    });

    return Collection;
});