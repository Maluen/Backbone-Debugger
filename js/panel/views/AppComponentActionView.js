/* NOTA BENE: il metodo passato deve esser già stato fetchato / con dati validi. */

define(["backbone", "underscore", "jquery", 
		"handlebars", "text!templates/appComponentAction.html"],
function(Backbone, _, $, Handlebars, template) {
	
	var AppComponentActionView = Backbone.View.extend({

		template: Handlebars.compile(template),
		tagName: "tr",

		initialize: function(options) {
			_.bindAll(this);

			this.listenTo(this.model, "change", this.render);

			this.render();
		},

		render: function() {
			var templateData = this.model.toJSON();
			// formatta il timestamp in "hh:mm:ss"
			var date = new Date(this.model.get("timestamp"));
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var seconds = date.getSeconds();
			if (hours < 10) hours = "0"+hours;
			if (minutes < 10) minutes = "0"+minutes;
			if (seconds < 10) seconds = "0"+seconds;
			templateData["time"] = hours + ":"+ minutes + ":"+ seconds;

			this.el.innerHTML = this.template(templateData); // NON usare this.$el.html() che disattiva gli event handler jquery delle sottoviste esistenti

			return this;
		},

		events: {
			"click .printTarget": "printTarget"
		},

		printTarget: function() {
			this.model.printTarget();
		}

    });
    return AppComponentActionView;
});