define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView", 
		"text!templates/appComponents.html"],
function(Backbone, _, $, Handlebars, CollectionView, template) {
	
	var AppComponentsView = CollectionView.extend({

		template: Handlebars.compile(template),
		CollectionItemView: undefined, // oggetto sottotipo di AppComponentView
		collectionElSelector: ".appComponentList",

		events: {
			"click .openAll": "openAll",
			"click .closeAll": "closeAll"
		},

		openAll: function() {
			this.forEachItemView(_.bind(function(componentView) {
				componentView.open();
			}, this));
		},

		closeAll: function() {
			this.forEachItemView(_.bind(function(componentView) {
				componentView.close();
			}, this));
		},

		getComponentView: function(componentIndex) {
			// cerca la vista del componente
			for (var i=0,l=this.collectionItemViews.length; i<l; i++) {
				var currentComponentView = this.collectionItemViews[i];
				var currentComponent = currentComponentView.model;
				if (currentComponent.get("component_index") === componentIndex) {
					return currentComponentView;
				}
			}

			return;
		}

    });
    return AppComponentsView;
});