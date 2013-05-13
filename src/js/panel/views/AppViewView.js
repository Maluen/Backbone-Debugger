/* Vista per un modello di tipo AppView */

define(["backbone", "underscore", "jquery", "views/AppComponentView", 
		"handlebars", "text!templates/appView.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {
	
	var AppViewView = AppComponentView.extend({

		template: Handlebars.compile(template),

		componentStatus: "Created", // può essere "Created", "Rendered" o "Removed"

		// rileva i cambiamenti di status della vista dell'app
		// a seconda delle operazioni effettuate su di essa
		handleAction: function(action) {
			if (action.get("type") == "Operation") {
				var operationName = action.get("name");
				if (operationName == "render") {
					this.componentStatus = "Rendered";
				} else if (operationName == "remove") {
					this.componentStatus = "Removed";
				}
				this.render();
			}
		},

		// aumenta i dati del template con lo status
		templateData: function() {
			var templateData = AppComponentView.prototype.templateData.apply(this, arguments);
			templateData["component_status"] = this.componentStatus;
			
			return templateData;
		},

		events: {
			"click .printAppComponent": "printAppComponent", // definita nel padre
			"click .printElement": "printElement"
		},

		printElement: function() {
			this.model.printElement();
		}

    });
    return AppViewView;
});