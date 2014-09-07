/* View activated while waiting for the inspected page loading. */

define(["backbone", "underscore", "jquery", "views/View", "handlebars", "text!templates/waiting.html"],
function(Backbone, _, $, View, Handlebars, template) {

    var WaitingView = View.extend({

        template: Handlebars.compile(template),

        // the waiting text to display
        waitingText: undefined,

        initialize: function(options) {
            options = options || {};

            _.bindAll(this);

            this.setWaitingText(options.waitingText || '');
            // (first render provided by above function)
        },

        setWaitingText: function(waitingText) {
            this.waitingText = waitingText;
            this.render();
        },

        templateData: function() {
            return {
                'waitingText': this.waitingText
            };
        },

        render: function() {
            this.el.innerHTML = this.template(this.templateData()); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            return this;
        }
    });
    return WaitingView;
});
