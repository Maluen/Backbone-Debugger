define(["backbone", "underscore", "jquery", "views/AppComponentView",
        "templates/appRouter"],
function(Backbone, _, $, AppComponentView, template) {

    var AppRouterView = AppComponentView.extend({

        template: template,

        events: $.extend({

        }, AppComponentView.prototype.events)

    });
    return AppRouterView;
});
