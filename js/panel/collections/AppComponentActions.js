/* This collection is sorted in reverse order (latest first) */

define(["backbone", "underscore", "backboneAgentClient",
        "collections/Collection", "models/AppComponentAction", "setImmediate"],
function(Backbone, _, backboneAgentClient, Collection, AppComponentAction, setImmediate) {

    var AppComponentActions = Collection.extend({

        component: undefined, // oggetto sottotipo di AppComponent
        model: AppComponentAction,

        orderReverse: true,

        initialize: function(models, options) {
            this.component = options.component;

            Collection.prototype.initialize.apply(this, arguments);
        },

        url: function() {
            return this.component.url()+'/actions';
        },

        createModel: function(modelIndex) {
            var model = new this.model();
            model.component = this.component;
            model.index = modelIndex;
            return model;
        }

    });
    return AppComponentActions;
});
