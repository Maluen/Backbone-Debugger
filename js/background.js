/**
 * Permette la comunicazione in tempo reale dalla pagina al panel
 * rigirando a quest'ultimo i messaggi inviati tramite il content script.
 * 
 * N.B: il background è unico per tutte le schede del browser e quindi per le
 * istanze dell'estensione, per questo le varie porte di comunicazione 
 * sono indicizzate dall'id della scheda a cui si riferiscono.
 */

// Hash che ha per chiave l'id del tab e per valore la porta di comunicazione con
// il pannello di devtools.
var panelPorts = {};

// Registrazione dei panel
chrome.extension.onConnect.addListener(function(port) {
	if (port.name !== "devtoolspanel") return;
	
	port.onMessage.addListener(function(message) {
		if (message.name == "identification") {
			var tabId = message.data;
			panelPorts[tabId] = port;
		}
	});
});

// Messaggio dalla pagina (tramite il content script), lo invia al panel
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
	debugger;
	if (sender.tab) {
		var port = panelPorts[sender.tab.id];
		if (port) {
			port.postMessage(message);
		}
	}
});

// Avvisa il panel quando viene aggiornata la pagina (refresh, cambio sito, etc.)
// (tipicamente utilizzato dal panel per fare il refresh)
chrome.tabs.onUpdated.addListener(function(updatedTabId, changeInfo) {
	if (changeInfo.status == "loading") { // (l'evento viene emesso anche una seconda volta al complete dell'operazione)
		var port = panelPorts[updatedTabId];
		if (port) {
			port.postMessage({
				target: 'page',
				name: 'updated'
			});
		}
	}
});