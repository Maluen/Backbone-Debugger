define(["backbone", "views/HomeView"],
function(Backbone, HomeView) {

    var Router = Backbone.Router.extend({

        initialize: function() {
            this.contentEl = document.getElementById("content");
            this.currentView = undefined;
        },

        routes: {
            "": "home"
        },

        home: function() {
            this.showView(HomeView);
        },
        
        showView: function(View) {
            if (this.currentView) {
                this.currentView.remove();
            }
            
            this.currentView = new View();
            this.contentEl.appendChild(this.currentView.el);
        }

    });
    return Router;
});
