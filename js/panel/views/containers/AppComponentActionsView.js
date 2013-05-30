define(["backbone", "underscore", "jquery", "handlebars", "views/containers/CollectionView",
		"views/AppComponentActionView", "text!templates/appComponentActions.html"],
function(Backbone, _, $, Handlebars, CollectionView, AppComponentActionView, template) {
	
	var AppComponentActionsView = CollectionView.extend({

		template: Handlebars.compile(template),
		CollectionItemView: AppComponentActionView,
		collectionElSelector: ".appComponentActionsTable",

		// le azioni vengono visualizzate in ordine inverso (dalle ultime alle prime)
		forEachItemView: function(handleItemView) {
			for (var i=this.collectionItemViews.length-1; i>=0; i--) {
				var collectionItemView = this.collectionItemViews[i];
				handleItemView(collectionItemView, i, this.collectionItemViews);
			}
		}

    });
    return AppComponentActionsView;
});