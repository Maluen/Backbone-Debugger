/* Collezione di componenti dell'applicazione di una data categoria. 
   E' il tipo padre di tutte le altre collezioni di componenti (di viste, modelli, etc.) */

define(["backbone", "underscore", "backboneAgentClient",
        "collections/Collection", "collections/AppComponentActions"],
function(Backbone, _, backboneAgentClient, Collection, AppComponentActions) {

    var AppComponents = Collection.extend({

        componentCategory: undefined, // categoria dei componenti (es. "View", "Model", etc.)
        url: undefined, // must be defined by child types

        createModel: function(componentIndex) {
            var model = new this.model();
            model.index = componentIndex;
            return model;
        }

    });
    return AppComponents;
});
