/* View activated when the application is in debug mode. */

define(["backbone", "underscore", "jquery", "views/View", "handlebars", "text!templates/debugger.html",
        "views/containers/AppViewsView", "views/containers/AppModelsView",
        "views/containers/AppCollectionsView", "views/containers/AppRoutersView"],
function(Backbone, _, $, View, Handlebars, template,
         AppViewsView, AppModelsView, AppCollectionsView, AppRoutersView) {

    var DebuggerView = View.extend({

        template: Handlebars.compile(template),
        className: "fill", // needed for 100% height layout

        tabTypes: { // hash <tabId, tabType>
            "appViews": AppViewsView,
            "appModels": AppModelsView,
            "appCollections": AppCollectionsView,
            "appRouters": AppRoutersView
        },
        tabViews: {}, // hash <tabId, tabView> where tabView is of type tabTypes[tabId]

        initialize: function(options) {
            _.bindAll(this);

            this.render();

            // open default tab
            var defaultTabElement = this.$(".mainTabs>.active");
            var defaultTabContentElement = this.$(defaultTabElement.find('a').attr("href"));
            this.openTab(defaultTabElement, defaultTabContentElement);
        },

        render: function() {
            this.el.innerHTML = this.template();  // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            // create sub-views for tabs
            var tabIndex = 0;
            _.each(this.tabTypes, function(TabType, tabId) {
                var tabView = this.tabViews[tabId];

                if (!tabView) {
                    tabView = new TabType({
                        el: this.$('#'+tabId)
                    });
                    this.tabViews[tabId] = tabView;
                }

                // Fix scroll alignment bug on devtools resizing:
                // by absolute positioning the tab contents, the contents size change
                // doesn't affect the position of the siblings.
                // NOTE: the distance between the contents should be greater than the maximum
                // devtools width (i.e. the screen width) or the contents may overlap
                tabView.$el.css("left", tabIndex*1000+"em");
                tabIndex++;
            }, this);

            return this;
        },

        openTab: function(tabElement, tabContentElement) {
            var currentTabElement = this.$(".mainTabs>.active");

            // notify closed to old tab
            var currentTabContentElement = this.$(currentTabElement.find('a').attr("href"));
            var currentTabId = currentTabContentElement.attr('id');
            var currentTabView = this.tabViews[currentTabId];
            if (currentTabView && typeof currentTabView.notifyClosed == 'function') {
                currentTabView.notifyClosed();
            }

            // change highlighted tab
            currentTabElement.removeClass("active");
            tabElement.addClass("active");

            // display tab content
            var tabsContentContainer = this.$('.mainTabsContent');
            tabsContentContainer.scrollLeft(tabsContentContainer.scrollLeft() +
                                           tabContentElement.position().left);

            // notify opened to new tab
            var tabId = tabContentElement.attr('id');
            var tabView = this.tabViews[tabId];
            if (tabView && typeof tabView.notifyOpened == 'function') {
                tabView.notifyOpened();
            }
        },

        events: {
            "keydown": "disableTabKey",
            "click .mainTabs>li": "onTabClicked",
            "click .inspectComponent": "inspectComponent"
        },

        // disable tab key default action, since it causes horizontal scrolling to another tab
        disableTabKey: function(event) {
            if (event.keyCode == 9) event.preventDefault();
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

            var componentsView = this.tabViews["app"+componentCategory+"s"];
            // filter the components to show the one to inspect (to make sure it is visible)
            componentsView.search('"component_index '+componentIndex+'"'); // strict search
            // open the tab that shows the component
            var tabElement = this.$("#app"+componentCategory+"sTab");
            var tabContentElement = this.$("#app"+componentCategory+"s");
            this.openTab(tabElement, tabContentElement);
            // wait end of search
            this.listenToOnce(componentsView, "child:show", _.bind(function(child) { // the component child passed the search
                if (child.model.get('component_index') == componentIndex) { // child is the component we are searching
                    var componentView = child;
                    // open the component and scroll to it
                    componentView.open();
                    tabContentElement.scrollTop(tabContentElement.scrollTop() + componentView.$el.position().top); // obsolete: the search should return just one component
                    // highlight the component
                    componentView.highlightAnimation();
                }
            }, this));
        }
    });
    return DebuggerView;
});
