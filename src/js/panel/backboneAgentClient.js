define(["backbone", "underscore", "inspectedPageClient"], function(Backbone, _, inspectedPageClient) {
    var backboneAgentClient = new (function() {
        _.extend(this, Backbone.Events);

        this.initialize = function() {
        	_.bindAll(this);
        }

        // Chiama la callback con un booleano che indica se l'agent è attivo o meno
        // sulla pagina ispezionata.
        this.isActive = function(callback) {
			// Aspetta che la pagina ispezionata sia pronta in modo da attendere
			// l'eventuale caricamento dell'agent (se questo fosse attivo)
			inspectedPageClient.ready(function() {
				inspectedPageClient.execFunction(function() {
					return (window.__backboneAgent !== undefined);
				}, [], function(isActive) { // on executed
					callback(isActive);
				});
			});
        }

        // Avvia l'agent riavviando la pagina ispezionata e iniettandolo all'inizio di questa.
        this.activate = function() {
            /*
            inspectedPageClient.reloadInjecting([
                chrome.extension.getURL("js/lib/watch.js"),
                chrome.extension.getURL("js/lib/Object.observe.poly.js"),
                chrome.extension.getURL("js/backboneAgent.js")
            ]);
            */
            inspectedPageClient.reloadInjecting([
                chrome.extension.getURL("js/backboneAgent/loader.js")
            ], {
                "extensionUrl": chrome.extension.getURL("")
            });
        }

        // Esegue la funzione sull'inspected page utilizzando l'agent come context.
        this.execFunction = function(func, args, onExecuted) {
            inspectedPageClient.execFunction(func, args, onExecuted, "window.__backboneAgent");
        }

        this.initialize();
    })();
    return backboneAgentClient;
});