// Script caricato ogni volta che viene selezionato un elemento nel pannello elements dei devtools.

// Funzione eseguita nel contesto della pagina ispezionata, restituisce true se
// il backbone agent è attivo
var isBackboneAgentActive = function() {
	return window.__backboneAgent !== undefined;
}

// Funzione eseguita nel contesto della pagina ispezionata, la quale ha accesso anche
// alla variabile $0 contenente l'elemento html selezionato nel pannello elements.
// Restituisce l'indice della vista corrispondente se esiste, undefined altrimenti.
// N.B: suppone che il backboneAgent sia attivo
var getViewIndex = function() {
	var viewInfo = window.__backboneAgent.getAppViewInfoFromElement($0);
	return viewInfo? viewInfo.index : undefined;
}

window.onload = function() {
	// controlla se il backbone agent è attivo
	chrome.devtools.inspectedWindow.eval("("+isBackboneAgentActive+")()", function(result, isException) {
        if (isException) throw result;
        if (!result) {
        	// backbone agent non attivo, non prosegue (la sidebar rimane vuota)
        	return;
        }

		// Recupera l'indice della vista backbone
		chrome.devtools.inspectedWindow.eval("("+getViewIndex+")()", function(result, isException) {
	        if (isException) throw result;

	        var viewIndex = result;
	        // visualizza l'indice della vista se c'è
 	        var backboneView = document.getElementById("backboneView");
	        backboneView.innerHTML = (viewIndex !== undefined) ? "View "+viewIndex : "none";
        	// mostra box con la vista backbone
        	var viewIndexContainer = document.getElementById("backboneViewContainer");
        	viewIndexContainer.style.display = "block";
	    });
    });
}