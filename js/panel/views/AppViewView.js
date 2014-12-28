/* View for AppView model */

define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appView.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppViewView = AppComponentView.extend({

        template: Handlebars.compile(template),

        events: $.extend({
            "click .printElement": "printElement"
        }, AppComponentView.prototype.events),

        printElement: function() {
            this.model.printElement();
        },

        render: function() {
            AppViewView.__super__.render.apply(this, arguments); // Call superclass render
            var self = this;
            var appComponent = this.$('.appComponent');

            appComponent.on('hidden', function(event) { // fired just after the hide animation ends
                if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                    self.unHighlightDOMElementUnlessOpened()
                }
            });
            appComponent.on('show', function(event) { // fired just before the show animation starts
                if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                    self.highlightDOMElement()
                }
            });
        },

        highlightDOMElement: function() {
            this.model.highlightElement();
        },

        unHighlightDOMElementUnlessOpened: function() {
            if (!this.isOpened()) {
                this.model.unHighlightElement();
            }
        }

    });
    return AppViewView;
});
