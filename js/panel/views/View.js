define(["backbone", "underscore", "jquery", "chaplin"], function(Backbone, _, $, Chaplin) {

    var View = Chaplin.View.extend({

        initialize: function(options) {
            Chaplin.View.prototype.initialize.apply(this, arguments);
            
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
