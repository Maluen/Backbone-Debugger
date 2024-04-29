/* View activated while waiting for the inspected page loading. */

define(["backbone", "underscore", "jquery", "views/View", "templates/waiting"],
function(Backbone, _, $, View, template) {

    var WaitingView = View.extend({

        template: template,

        // the waiting text to display
        waitingPhase: undefined,

        initialize: function(options) {
            View.prototype.initialize.apply(this, arguments);

            options = options || {};

            this.render();
        },

        inspectedPagePhase: function() {
            return this.setWaitingPhase('inspectedPage');
        },

        backbonePhase: function() {
            return this.setWaitingPhase('backbone');
        },

        setWaitingPhase: function(waitingPhase) {
            this.waitingPhase = waitingPhase;
            this.render();
        },

        templateData: function() {
            return {
                inspectedPagePhase: this.waitingPhase === 'inspectedPage',
                backbonePhase: this.waitingPhase === 'backbone'
            };
        },

        render: function() {
            this.el.innerHTML = this.template(this.templateData()); // DON'T use this.$el.html() because it removes the jQuery event handlers of existing sub-views
            return this;
        }
    });
    return WaitingView;
});
