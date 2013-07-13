/* View activated when the application is in debug mode. */

define(["backbone", "underscore", "jquery", "handlebars", "text!templates/debugger.html", 
        "views/containers/AppViewsView", "views/containers/AppModelsView", 
        "views/containers/AppCollectionsView", "views/containers/AppRoutersView"],
function(Backbone, _, $, Handlebars, template, 
         AppViewsView, AppModelsView, AppCollectionsView, AppRoutersView) {
    
    var DebuggerView = Backbone.View.extend({

        template: Handlebars.compile(template),
        className: "fill", // needed for 100% height layout

        appComponentsViews: {}, // hash <componentsCategory, componentsView>

        initialize: function(options) {
            _.bindAll(this);

            // create sub-views for app components
            this.appComponentsViews["View"] = new AppViewsView();
            this.appComponentsViews["Model"] = new AppModelsView();
            this.appComponentsViews["Collection"] = new AppCollectionsView();
            this.appComponentsViews["Router"] = new AppRoutersView();

            this.render();
        },

        render: function() {
            this.el.innerHTML = this.template();  // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            // insert sub-views for app components
            for (var componentsCategory in this.appComponentsViews) {
                if (this.appComponentsViews.hasOwnProperty(componentsCategory)) {
                    var componentsView = this.appComponentsViews[componentsCategory];
                    this.$("#app"+componentsCategory+"s").append(componentsView.el);
                }
            }

            return this;
        },

        openTab: function(tabElement, tabContentElement) {
            var currentTabElement = this.$(".nav-tabs .active");
            var currentTabContentElement = this.$(".tab-content .active");

            currentTabElement.removeClass("active");
            currentTabContentElement.removeClass("active");
            tabElement.addClass("active");
            tabContentElement.addClass("active");
        },

        events: {
            "click .inspectComponent": "inspectComponent"
        },

        inspectComponent: function(event) {
            var inspectButton = $(event.target);
            var componentCategory = inspectButton.attr("data-component-category");
            var componentIndex = parseInt(inspectButton.attr("data-component-index"), 10);
            
            var componentsView = this.appComponentsViews[componentCategory];
            var componentView = componentsView.getComponentView(componentIndex);
            if (componentView) {
                // open the tab that shows the component
                var tabElement = this.$("#app"+componentCategory+"sTab");
                var tabContentElement = this.$("#app"+componentCategory+"s");
                this.openTab(tabElement, tabContentElement);
                // open the component and scroll to it
                componentView.open();
                tabContentElement.scrollTop(tabContentElement.scrollTop() + componentView.$el.position().top);
                // highlight the component
                componentView.highlightAnimation();
            }
        }
    });
    return DebuggerView;
});