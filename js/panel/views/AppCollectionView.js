define(["backbone", "underscore", "jquery", "views/AppComponentView", "utils",
		"handlebars", "text!templates/appCollection.html"],
function(Backbone, _, $, AppComponentView, utils, Handlebars, template) {
	
	var AppCollectionView = AppComponentView.extend({

		template: Handlebars.compile(template),

		componentStatus: "instantiated", // è l'ultimo stato di sincronizzazione, es. "read (success)"

		// rileva i cambiamenti di status della collezione dell'app
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
			// mantiene aperta la lista dei modelli se lo era
			var isModelsOpen = false;
			var appCollectionModelsEl = this.$(".models");
			if (appCollectionModelsEl.length > 0) { // la vista è già stata renderizzata precedentemente
				isModelsOpen = appCollectionModelsEl.hasClass("in");
			}
			templateData["isModelsOpen"] = isModelsOpen;
			// status
			templateData["component_status"] = this.componentStatus;
			
			return templateData;
		},

		events: {
			"click .printAppComponent": "printAppComponent" // definita nel padre
		}
    });
    return AppCollectionView;
});