define(["backbone", "underscore", "jquery"], function(Backbone, _, $) {

    var View = Backbone.View.extend({

        initialize: function(options) {
            _.bindAll(this);
        },

        visible: function(isVisible) {
            // TODO: If $el is not in display:block by default, this code could lead to a bug
            this.$el.css("display", isVisible? "block" : "none");
        }

    });
    return View;
});
