/* NOTE: the passed model must have already been fetched or have valid attributes. */

define(["backbone", "underscore", "jquery", "views/View", "views/containers/AppComponentActionsView"],
function(Backbone, _, $, View, AppComponentActionsView) {

    var AppComponentView = View.extend({

        template: undefined,
        tagName: "li",

        appComponentActionsView: undefined, // AppComponentActionsView for the component actions

        initialize: function(options) {
            View.prototype.initialize.apply(this, arguments);

            this.renderDOMListeners = [];

            // create sub-view for the component actions
            this.appComponentActionsView = new AppComponentActionsView({
                collection: this.model.actions,
                parent: this
            });

            this.listenTo(this.model, "change", this.render);

            this.render();
        },

        // Override that speeds up browser re-rendering of element when showing (instead of display none)
        show: function(showOrHide) {
            if (showOrHide) { // show
                this.$el.css({'height': '', 'overflow': ''});
                this.trigger('show');
            } else { // hide
                this.$el.css({'height': 0, 'overflow': 'hidden'});
                this.trigger('hide');
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
            // before render, clear render DOM listeners to prevent memory leaks and other nasty side effects
            _.each(this.renderDOMListeners, this.stopDOMListening, this);
            this.renderDOMListeners = [];

            var isHighlighting = this.$('.appComponentToggle').hasClass('highlight');

            var templateData = this.templateData();
            this.el.innerHTML = this.template(templateData); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            // insert the sub-view for the component actions
            this.$(".appComponentActionsContainer").append(this.appComponentActionsView.el);

            // restore animation if was active before render
            if (isHighlighting) this.highlightAnimation();

            // prevents the browser from rendering the component content when it is collapsed (closed), 
            // drastically decreasing the rendering time when the application has lots of components
            var appComponent = this.$('.appComponent');
            if (!templateData['isOpen']) {
                appComponent.css("display", "none");
            }
            this.renderDOMListeners.push(
                // fired by bootstrap just after the hide animation ends
                this.listenToDOM(appComponent, 'hidden', function(event) {
                    if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                        appComponent.css("display", "none");
                    }
                }),

                // fired by bootstrap just before the show animation starts
                this.listenToDOM(appComponent, 'show', function(event) {
                    if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                        appComponent.css("display", "block");
                    }
                })
            );

            // keep track of (manual) view open/close or collapsable elements collapse/uncollapse actions
            this.renderDOMListeners.push(
                // fired by bootstrap just after the show animation finished
                this.listenToDOM(this.$el, 'shown', function(event) {
                    if ($(event.target).is(appComponent)) this.trigger('open');
                    else this.trigger('collapsable:open');
                }),

                // fired by bootstrap just after the hide animation finished
                this.listenToDOM(this.$el, 'hidden', function(event) {
                    if ($(event.target).is(appComponent)) this.trigger('close');
                    else this.trigger('collapsable:close');
                })
            );

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
            this.trigger('open');
        },

        close: function() {
            // immediately close without animation
            var appComponent = this.$(".appComponent");
            appComponent.removeClass("in");
            appComponent.css("display", "none");
            this.render();  // required to update the css setted by a previous open animation
            this.trigger('close');
        },

        isOpened: function() {
            return this.$(".appComponent").hasClass("in");
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
