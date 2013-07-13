/* View activated while waiting for the inspected page loading. */

define(["backbone", "underscore", "jquery", "handlebars", "text!templates/waiting.html"],
function(Backbone, _, $, Handlebars, template) {

    var WaitingView = Backbone.View.extend({

        template: Handlebars.compile(template),

        initialize: function(options) {
            _.bindAll(this);

            this.render();
        },

        render: function() {
            this.el.innerHTML = this.template(); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            return this;
        }
    });
    return WaitingView;
});
