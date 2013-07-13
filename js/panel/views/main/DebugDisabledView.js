/* View activated when the application isn't in debug mode, allowing to activate it. */

define(["backbone", "underscore", "jquery", "handlebars", "text!templates/debugDisabled.html"],
function(Backbone, _, $, Handlebars, template) {
	
	var DebugDisabledView = Backbone.View.extend({

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
    return DebugDisabledView;
});