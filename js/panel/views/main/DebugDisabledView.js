/**
Vista attivata nel caso in cui la modalità debug non è attiva.
**/

define(["backbone", "underscore", "jquery", 
		"handlebars", "text!templates/debugDisabled.html"],
function(Backbone, _, $, Handlebars, template) {
	
	var DebugDisabledView = Backbone.View.extend({

		template: Handlebars.compile(template),

		initialize: function(options) {
			_.bindAll(this);

			this.render();
		},

		render: function() {
			this.el.innerHTML = this.template(); // NON usare this.$el.html() che disattiva gli event handler jquery delle sottoviste esistenti
			return this;
		}
    });
    return DebugDisabledView;
});