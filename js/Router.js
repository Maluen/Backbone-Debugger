define(["backbone", "views/LayoutView", "views/HomeView", "views/NotFoundView"],
function(Backbone, LayoutView, HomeView, NotFoundView) {

    var Router = Backbone.Router.extend({

        initialize: function() {
            this.layoutView = new LayoutView();
            
            // show layout
            document.body.appendChild(this.layoutView.el);
        },

        routes: {
            "": "home",
            
            '*notFound': 'notFound' // 404
        },

        home: function() {
            this.layoutView.setCurrentView(HomeView);
        },
        
        notFound: function() {
            this.layoutView.setCurrentView(NotFoundView);
        }

    });
    return Router;
});
