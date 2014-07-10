/* NOTE: the passed model must have already been fetched or have valid attributes. */

define(["backbone", "underscore", "jquery", "chaplin", "views/View", "handlebars", "text!templates/appComponentAction.html"],
function(Backbone, _, $, Chaplin, View, Handlebars, template) {

    var AppComponentActionView = Chaplin.View.extend({

        template: Handlebars.compile(template),
        tagName: "tr",
        autoRender: true,

        initialize: function(options) {
            Chaplin.View.prototype.initialize.apply(this, arguments);
            
            _.bindAll(this);

            this.listenTo(this.model, "change", this.render);
        },

        getTemplateData: function() {
            var templateData = this.model.toJSON();

            // format timestamp in "hh:mm:ss"
            var date = new Date(this.model.get("timestamp"));
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            if (hours < 10) hours = "0"+hours;
            if (minutes < 10) minutes = "0"+minutes;
            if (seconds < 10) seconds = "0"+seconds;
            templateData["time"] = hours + ":"+ minutes + ":"+ seconds;

            return templateData;
        },

        events: {
            "click .printData": "printData"
        },

        // Print action data in console
        printData: function() {
            this.model.printData();
        }

    });
    return AppComponentActionView;
});
