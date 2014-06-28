/* NOTE: the passed model must have already been fetched or have valid attributes. */

define(["backbone", "underscore", "jquery", "views/View", "views/containers/AppComponentActionsView"],
function(Backbone, _, $, View, AppComponentActionsView) {

    var AppComponentView = View.extend({

        template: undefined,
        tagName: "li",

        appComponentActionsView: undefined, // AppComponentActionsView for the component actions

        initialize: function(options) {
            _.bindAll(this);

            // create sub-view for the component actions
            this.appComponentActionsView = new AppComponentActionsView({
                collection: this.model.actions
            });

            this.listenTo(this.model, "change", this.render);

            this.render();
        },

        // Override that avoids browser re-rendering of element when showing
        show: function(showOrHide) {
            if (showOrHide) { // show
                this.$el.css({'height': '', 'overflow': ''});
            } else { // hide
                this.$el.css({'height': 0, 'overflow': 'hidden'});
            }
        },
        
        isShown: function() {
            // might be true also if the parent is hidden, differently from jquery ".is(':visible')"
            return this.$el.css('height') != 0 || this.$el.css('overflow') != 'hidden';
        },

        // Return the template data, can be overridden by subtypes to augment / alter the returned data.
        templateData: function() {
            var templateData = this.model.toJSON();
            // don't close the component content it it was open
            templateData["isOpen"] = this.$(".appComponent").hasClass("in");

            return templateData;
        },

        render: function() {
            // before render, remove .appComponent handlers to prevent memory leaks
            this.$('.appComponent').off();

            var templateData = this.templateData();
            this.el.innerHTML = this.template(templateData); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            // insert the sub-view for the component actions
            this.$(".appComponentActions").append(this.appComponentActionsView.el);

            // prevents the browser from rendering the component content when it is collapsed (closed), 
            // drastically decreasing the rendering time when the application has lots of components
            var appComponent = this.$('.appComponent');
            if (!templateData['isOpen']) {
                appComponent.css("display", "none");
            }
            appComponent.on('hidden', function(event) { // fired just after the hide animation ends
                if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                    appComponent.css("display", "none");
                }

            });
            appComponent.on('show', function(event) { // fired just before the show animation starts
                if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                    appComponent.css("display", "block");
                }
            });

            return this;
        },

        events: {
            "click .printAppComponent": "printAppComponent"
        },

        open: function() {
            // immediately open without animation
            var appComponent = this.$(".appComponent");
            appComponent.css("display", "block");
            appComponent.addClass("in");
            this.render(); // required to update the css setted by a previous close animation
        },

        close: function() {
            // immediately close without animation
            var appComponent = this.$(".appComponent");
            appComponent.removeClass("in");
            appComponent.css("display", "none");
            this.render();  // required to update the css setted by a previous open animation
        },

        highlightAnimation: function() {
            var animatedEl = this.$(".appComponentToggle");

            animatedEl.addClass("highlight");
            animatedEl.one("webkitAnimationEnd", _.bind(function() {
                animatedEl.removeClass("highlight");
            }, this));
        },

        printAppComponent: function() {
            this.model.printThis();
        }

    });
    return AppComponentView;
});
