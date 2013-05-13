/**
 * Riceve i messaggi dall'injected script e se questi
 * sono per il panel, li gira al background che penserà al resto.
 * 
 * Nota: non è possibile far comunicare direttamente la pagina
 * con il panel in quanto si trovano in due "mondi" diversi, mentre
 * la pagina può comunicare con il content script tramite
 * l'invio di messaggi di HTML5.
 * Invece nell'altro verso il panel può accedere direttamente alla pagina
 * (tramite API dei devtools), per cui l'altro lato della comunicazione non è necessario.
 */

// Messaggio dalla pagina, lo gira al background che farà il resto.
window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window) return;
    
 	var message = event.data;
	chrome.extension.sendMessage(message);
}, false);

// Avvisa il panel quando la pagina è pronta 
// (tipicamente utilizzato dal panel per aspettare il caricamento dell'agent
//  e quindi controllare se questo è presente, cioè se la modalità debug è attiva)
window.addEventListener('DOMContentLoaded', function() {
	// il messaggio viene inviato al background che farà il resto
	chrome.extension.sendMessage({
		target: 'page',
		name: 'ready'
	});
}, false);
