/**
Vista attivata durante l'attesa per il caricamento della pagina ispezionata.
**/

define(["backbone", "underscore", "jquery", 
		"handlebars", "text!templates/waiting.html"],
function(Backbone, _, $, Handlebars, template) {
	
	var WaitingView = Backbone.View.extend({

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
    return WaitingView;
});