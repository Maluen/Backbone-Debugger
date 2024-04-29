/* L'aggiornamento in tempo reale viene attivato automaticamente al termine della fetch. */

define(["backbone", "underscore", "collections/AppComponentActions", 
        "backboneAgentClient"],
function(Backbone, _, AppComponentActions, backboneAgentClient) {

    var AppComponent = Backbone.Model.extend({

        category: undefined, // category of the component (eg. "View", "Model", etc.)

        // index of the component (relative to its category), is treated like an id and is mandatory
        index: undefined,

        actions: undefined, // oggetto di tipo AppComponentActions

        isRealTimeUpdateActive: false,

        initialize: function(attributes, options) {
            this.actions = new AppComponentActions(undefined, {
                component: this
            });
        },

        url: function() {
            var collectionUrl = (typeof this.collection.url == 'function') ?
                                this.collection.url() : this.collection.url;
            return collectionUrl+'/'+this.index;
        },

        // richiede che l'index sia settato in quanto è usato come un id.
        // Chiama onComplete al termine dell'operazione.
        fetch: function(onComplete) {
            if (this.index === undefined) {
                throw "The index is undefined.";
            }

            backboneAgentClient.execFunction(function(category, index) {
                var appComponentInfo = this.appComponentsInfos[category].at(index);
                return appComponentInfo.attributes;
            }, [this.category, this.index],
            _.bind(function(appComponentAttributes) { // on executed
                setTimeout(_.bind(function() { // prevent UI blocking
                    // reset attributes
                    this.clear({silent: true});
                    this.set(appComponentAttributes);
                    this.realTimeUpdate();
                    if (onComplete !== undefined) onComplete();
                }, this));
            }, this));
        },

        realTimeUpdate: function() {
            // previene l'attivazione multipla della real time update
            // (per evitare che la logica venga eseguita più di una volta)
            if (this.isRealTimeUpdateActive) return;

            setTimeout(_.bind(function() { // binding many consecutive events freezes the ui (happens if there are a lot of app components)
                var messageName = "backboneAgent:"+this.category+":"+this.index+":change";
                this.listenTo(backboneAgentClient, messageName, function(message) {
                    var changeInfo = message.data;

                    // update the local value of the changed attribute
                    backboneAgentClient.execFunction(function(category, index, attributeName) {
                        var appComponentInfo = this.appComponentsInfos[category].at(index);
                        return appComponentInfo.get(attributeName);
                    }, [this.category, this.index, changeInfo.attributeName],
                    _.bind(function(attributeValue) {
                        this.set(changeInfo.attributeName, attributeValue);
                    }, this));

                });

                // l'avvio della realTimeUpdate è rimandato con la setTimeout, per cui eventuali report
                // inviati tra l'esecuzione e l'effettivo avvio di questa non sono stati gestiti,
                // facendo la fetch adesso si ottiene allora lo stato comprensivo degli eventuali cambiamenti,
                // dopodichè i prossimi report saranno gestiti.
                this.fetch();
            }, this));

            this.isRealTimeUpdateActive = true;
        },

        // print the app component on the console
        printThis: function() {
            backboneAgentClient.execFunction(function(componentCategory, componentIndex) {
                var appComponentInfo = this.appComponentsInfos[componentCategory].at(componentIndex);
                var appComponent = appComponentInfo.component;
                console.log(componentCategory+" "+componentIndex+":", appComponent); // e.g. "View 1: ..."
            }, [this.category, this.index], _.bind(function() { // on executed
                // do nothing
            }, this));
        }
    });
    return AppComponent;
});
