define(["backbone", "underscore", "jquery", "views/AppComponentView", 
		"handlebars", "text!templates/appModel.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {
	
	var AppModelView = AppComponentView.extend({

		template: Handlebars.compile(template),

		componentStatus: "instantiated", // è l'ultimo stato di sincronizzazione, es. "read (success)"

		// rileva i cambiamenti di status del modello dell'app
		// a seconda della sua sincronizzazione
		handleAction: function(action) {
			if (action.get("type") == "Sync") {
				var syncStatus = action.get("name");
				this.componentStatus = syncStatus;
				this.render();
			}
		},

		templateData: function() {
			var templateData = AppComponentView.prototype.templateData.apply(this, arguments);
			// mantiene aperta la lista degli attributi se lo era
			var isAttributesOpen = false;
			var appModelAttributesEl = this.$(".attributes");
			if (appModelAttributesEl.length > 0) { // la vista è già stata renderizzata precedentemente
				isAttributesOpen = appModelAttributesEl.hasClass("in");
			}
			templateData["isAttributesOpen"] = isAttributesOpen;
			// status
			templateData["component_status"] = this.componentStatus;
			
			return templateData;
		},

		events: {
			"click .printAppComponent": "printAppComponent", // definita nel padre
			"click .printAppModelAttribute": "printAppModelAttribute"
		},

		printAppModelAttribute: function(event) {
			// TODO: cosa succede se attributeName ha caratteri html codificati? es. "a<some"
			// il decode viene fatto in automatico da jquery?

			var button = $(event.target);
			var attributeName = button.attr("data-attribute-name");
			this.model.printAttribute(attributeName);
		}

    });
    return AppModelView;
});