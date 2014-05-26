define(["backbone", "underscore", "jquery"], function(Backbone, _, $) {

    var View = Backbone.View.extend({

        initialize: function(options) {
            _.bindAll(this);
        },

        // true to show, false to hide
        show: function(showOrHide) {
            this.$el.toggle(showOrHide);
        },

        isShown: function() {
            // might be true also if the parent is hidden, differently from jquery ".is(':visible')"
            return this.$el.css('display') != 'none';
        }

    });
    return View;
});
