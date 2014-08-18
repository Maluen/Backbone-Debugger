Modules.set('models.Model', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');

    var Model = Component.extend({

        constructor: function(attributes, options) {
            attributes = attributes || {};
            options = options || {};

            var defaults = typeof this.defaults == 'function' ? this.defaults() : this.defaults;
            defaults = defaults || {};

            this.attributes = {};
            u.extend(this.attributes, defaults);
            u.extend(this.attributes, attributes);

            this.changed = {};
            
            this.initialize.apply(this, arguments);
        },

        set: function(name, value) {
            this.attributes[name] = value;

            u.each(this.changed, function(value, attribute) {
                delete this.changed[attribute];
            }, this);
            this.changed[name] = value;

            this.trigger('change:'+name, this, value);
            this.trigger('change', this);
        },

        get: function(name) {
            return this.attributes[name];
        }

    });

    return Model;
});