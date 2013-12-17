/* View activated while waiting for the inspected page loading. */

define(["backbone", "underscore", "jquery", "views/View", "handlebars", "text!templates/waiting.html"],
function(Backbone, _, $, View, Handlebars, template) {

    var WaitingView = View.extend({

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
