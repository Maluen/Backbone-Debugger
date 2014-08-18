Modules.set('models.AppComponentAction', function() {
    // imports
    var Model = Modules.get('models.Model');

    var AppComponentAction = Model.extend({

        // the AppComponentInfo object of the component this action belongs to
        appComponentInfo: undefined,

        // the index of the action relative to those of the appComponent
        index: null,

        defaults: function() {
            return {
                'index': null,
                'timestamp': new Date().getTime(), // milliseconds
                'type': null, // string
                'name': null, // string
                // mandatory if data is defined, can be
                // - "jQuery Event": if data is a jQuery Event object
                // - "event arguments": if data is an array with the arguments of a Backbone event
                'dataKind': null
            }
        },

        // the optional data about the action, it kept outside of the attributes
        // since could be not json-compatible.
        data: undefined,

        initialize: function(attributes, options) {
            options = options || {};

            this.appComponentInfo = options.appComponentInfo;
            this.index = options.index;
            this.data = options.data;

            // this.index is equal to the index attribute (the user could set one or the other)
            if (typeof this.index !== 'undefined' && this.index !== null) {
                this.attributes['index'] = this.index;
            } else {
                this.index = this.attributes['index'];
            }
        }
    });

    return AppComponentAction;
});