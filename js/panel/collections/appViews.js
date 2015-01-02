define(["backbone", "underscore", "collections/AppComponents", "models/AppView", 
		"backboneAgentClient"],
function(Backbone, _, AppComponents, AppView, backboneAgentClient) {

    var appViews = new (AppComponents.extend({

        componentCategory: "View",
        model: AppView,
        url: '/views',

        unhighlightViewElements: function() {
        	backboneAgentClient.execFunction(function() {
        	    this.appComponentControllers['View'].unhighlightViewElements();
        	});
        }

    }))();
    return appViews;
});
