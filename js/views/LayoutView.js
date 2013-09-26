define(["backbone", "jquery", "handlebars", "text!templates/layout.html"],
function(Backbone, $, Handlebars, template) {

    var LayoutView = Backbone.View.extend({

        template: Handlebars.compile(template),

        initialize: function(options) {
            this.currentView = undefined;
                    
            this.render();
        },

        render: function() {
            this.el.innerHTML = this.template(); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            return this;
        },
        
        setCurrentView: function(View) {
            if (this.currentView) {
                this.currentView.remove();
            }
            this.currentView = new View();
            this.$(".content").append(this.currentView.el);
        }
    });
    return LayoutView;
});
