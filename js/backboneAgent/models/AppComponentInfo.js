Modules.set('models.AppComponentInfo', function() {
    // imports
    var Model = Modules.get('models.Model');
    var u = Modules.get('utils');
    var AppComponentActions = Modules.get('collections.AppComponentActions');

    var AppComponentInfo = Model.extend({

        // category of the Backbone component, i.e. "View", "Model", "Collection" or "Router"
        category: undefined,

        // used as an id among the components of its category
        index: null,

        // the Backbone app component object (e.g. the view instance)
        component: undefined,

        defaults: {
            "index": null // int (equal to this.index)
        },

        // AppComponentActions collection with the actions of the component
        actions: undefined,

        initialize: function(attributes, options) {
            options = options || {};

            this.category = options.category;
            this.index = options.index;
            this.component = options.component;
            this.actions = options.actions;

            // this.index is equal to the index attribute (the user could set one or the other)
            if (typeof this.index !== 'undefined' && this.index !== null) {
                this.attributes['index'] = this.index;
            } else {
                this.index = this.attributes['index'];
            }

            if (typeof this.actions == 'undefined') {
                this.actions = new AppComponentActions([], {
                    appComponentInfo: this
                });
            }
            // re-trigger any actions event (prefixing it)
            this.actions.on('all', u.bind(function(eventName /*, arg1, ... , argN */) {
                var eventArguments = Array.prototype.slice.call(arguments, 1); // from second argument
                this.trigger.apply(this, ['actions:'+eventName].concat(eventArguments));
            }, this));
        }

    });

    return AppComponentInfo;
});
