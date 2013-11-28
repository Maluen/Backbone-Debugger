define(["backbone", "underscore", "models/AppComponent", "backboneAgentClient"],
function(Backbone, _, AppComponent, backboneAgentClient) {

    var AppCollection = AppComponent.extend({

        category: "Collection",

        defaults: {
            "component_index": null, // int
            "component_name": null, // string
            "component_hasModel": null, // bool, true se la collezione ha la proprietà model settata
                                        // (che mantiene il tipo dei modelli)
            "component_models": null, // array con gli indici dei modelli contenuti dalla collezione
            "component_url": null, // string
            "component_status": "instantiated" // last sync status, e.g. "read (success)"
        },

        // Change the component status by analyzing its "Sync" actions.
        handleAction: function(action) {
            if (action.get("type") == "Sync") {
                var syncStatus = action.get("name");
                this.set("component_status", syncStatus);
            }
        },

        fetchLogic: function(onComplete) {
            backboneAgentClient.execFunction(function(componentIndex, componentStatus) {
                var appCollectionInfo = this.getAppComponentInfoByIndex("Collection", componentIndex);
                var collectionModels = appCollectionInfo.component.models;

                var collectionModelsIndexes = [];
                for (var i=0,l=collectionModels.length; i<l; i++) {
                    var model = collectionModels[i];
                    var modelIndex = this.getAppComponentInfo(model).index;
                    collectionModelsIndexes.push(modelIndex);
                }

                var collectionUrl = appCollectionInfo.component.url;
                if (typeof collectionUrl === "function") {
                    // l'url può essere specificato anche come una funzione che lo restituisce
                    try {
                        // se l'url non può essere generato potrebbe essere sollevata
                        // un'eccezione (definita dall'utente)
                        collectionUrl = collectionUrl();
                    } catch (exception) {
                        collectionUrl = null;
                    }
                }

                var componentName = appCollectionInfo.component.constructor.name ||
                                    collectionUrl || null;

                var appCollectionAttributes = {
                    "component_index": appCollectionInfo.index,
                    "component_name": componentName,
                    "component_hasModel": appCollectionInfo.component.model !== undefined,
                    "component_models": collectionModelsIndexes,
                    "component_url": collectionUrl,
                    "component_status": componentStatus
                };
                return appCollectionAttributes;
            }, [this.get("component_index"), this.get("component_status")], onComplete);
        }
    });
    return AppCollection;
});
