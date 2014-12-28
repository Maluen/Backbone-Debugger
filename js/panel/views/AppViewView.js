/* View for AppView model */

define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "handlebars", "text!templates/appView.html"],
function(Backbone, _, $, AppComponentView, Handlebars, template) {

    var AppViewView = AppComponentView.extend({

        template: Handlebars.compile(template),

        render: function() {
            AppComponentView.prototype.render.apply(this, arguments);
            
            // TODO: unbind below elements on view remove to prevent memory leaks
            // (though as for now the components are never removed)
            var appComponent = this.$('.appComponent');
            appComponent.on('hidden', _.bind(function(event) { // fired just after the hide animation ends
                if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                    this.unHighlightDOMElementUnlessOpened()
                }
            }, this));
            appComponent.on('show', _.bind(function(event) { // fired just before the show animation starts
                if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
                    this.highlightDOMElement()
                }
            }, this));

            return this;
        },

        events: $.extend({
            "click .printElement": "printElement"
        }, AppComponentView.prototype.events),

        printElement: function() {
            this.model.printElement();
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
