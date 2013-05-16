/* L'aggiornamento in tempo reale viene attivato automaticamente in fase di inizializzazione. 
   N.B: l'attributo component_index ed altre proprietà necessarie per il funzionamento
   dell'aggiornamento in tempo reale devono essere passata alla initialize. */

define(["backbone", "underscore", "backboneAgentClient", "inspectedPageClient"],
function(Backbone, _, backboneAgentClient, inspectedPageClient) {
	
	var AppComponent = Backbone.Model.extend({

        category: undefined, // categoria del componente (es. "View", "Model", etc.)
        actions: undefined, // oggetto di tipo AppComponentActions

        isRealTimeUpdateActive: false,

		initialize: function(attributes, options) {
			_.bindAll(this);

			this.realTimeUpdate();
		},

		// funzione che chiama onComplete passandogli un hash con gli attributi del modello.
		fetchLogic: undefined, // abstract function(onComplete)

		// richiede che l'attributo component_index sia settato in quanto è usato come un id.
		// Chiama onComplete al termine dell'operazione.
		fetch: function(onComplete) {
			if (this.get("component_index") === undefined) {
				throw "The component_index attribute is undefined.";
			}

			this.fetchLogic(_.bind(function(appComponentAttributes) { // on executed
            	// resetta gli attributi
                this.clear({silent: true});
                this.set(appComponentAttributes);
                if (onComplete !== undefined) onComplete();
            }, this));
		},

		realTimeUpdate: function() {
			// previene l'attivazione multipla della real time update
			// (per evitare che la logica venga eseguita più di una volta)
			if (this.isRealTimeUpdateActive) return;

            this.listenTo(inspectedPageClient, "backboneAgent:report", _.bind(function(report) {
                var componentChanged = report.name == "change" && 
                					   report.componentCategory == this.category &&
                					   report.componentIndex === this.get("component_index");
                if (componentChanged) {
                	// recupera attributi aggiornati
                	this.fetch();
                }
            }, this));

			this.isRealTimeUpdateActive = true;
		},

		// stampa il componente dell'app sulla console
		printThis: function() {
            backboneAgentClient.execFunction(function(componentCategory, componentIndex) {
                var appComponentInfo = this.getAppComponentInfoByIndex(componentCategory, componentIndex);
                var appComponent = appComponentInfo.component;
                console.log(componentCategory+" "+componentIndex+":", appComponent); // es. "View 1: ..."
            }, [this.category, this.get("component_index")], _.bind(function() { // on executed
            	// do nothing
            }, this));
		}	
    });
    return AppComponent;
});