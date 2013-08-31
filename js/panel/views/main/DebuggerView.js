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
            var tabIndex = 0;
            for (var componentsCategory in this.appComponentsViews) {
                if (this.appComponentsViews.hasOwnProperty(componentsCategory)) {
                    var componentsView = this.appComponentsViews[componentsCategory];
                    var componentsViewElWrapper = this.$("#app"+componentsCategory+"s");
                    componentsViewElWrapper.append(componentsView.el);

                    // Fix scroll alignment bug on devtools resizing:
                    // by absolute positioning the tab contents, the contents size change
                    // doesn't affect the position of those below them.
                    // NOTE: the distance between the contents should be greater than the maximum
                    // devtools height (i.e. the screen height) or the contents may overlap
                    componentsViewElWrapper.css("top", tabIndex*1000+"em");
                    tabIndex++;
                }
            }

            return this;
        },

        openTab: function(tabElement, tabContentElement) {
            var currentTabElement = this.$(".mainTabs>.active");

            // change highlighted tab
            currentTabElement.removeClass("active");
            tabElement.addClass("active");

            // display tab content
            var tabsContentContainer = this.$('.mainTabsContent');
            tabsContentContainer.scrollTop(tabsContentContainer.scrollTop() +
                                           tabContentElement.position().top);
        },

        events: {
            "click .mainTabs>li": "onTabClicked",
            "click .inspectComponent": "inspectComponent"
        },

        onTabClicked: function(event) {
            var tabElementAnchor = $(event.target);
            if (tabElementAnchor.attr("data-toggle") == "tab") { // avoid dropdowns and other tab types
                var tabElement = tabElementAnchor.parents('li');
                var tabContentElement = this.$(tabElementAnchor.attr("href"));
                this.openTab(tabElement, tabContentElement);

                return false;
            }
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
