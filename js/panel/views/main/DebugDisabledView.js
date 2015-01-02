/* View activated when the application isn't in debug mode, allowing to activate it. */

define(["backbone", "underscore", "jquery", "views/View", "handlebars", "text!templates/debugDisabled.html"],
function(Backbone, _, $, View, Handlebars, template) {

    var DebugDisabledView = View.extend({

        template: Handlebars.compile(template),

        initialize: function(options) {
            View.prototype.initialize.apply(this, arguments);

            this.render();
        },

        render: function() {
            this.el.innerHTML = this.template(); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            return this;
        }

    });
    return DebugDisabledView;
});
