// as per chrome, frameURL is the original frame url without eventual hash string
var frameURL = window.location.origin + window.location.pathname + window.location.search;

var isTopFrame = (window.parent == window);

// Setup an Inspected page <-> Content script peer to peer MessageChannel connection.
// Since we don't know which of the two will start first, they both do the same thing:
// on start we send the started message, if the other didn't started yet, then the message will
// never be received by it, but in that case we'll receive its started message, 
// we'll then send the connect message since we're now sure that the other is ready to receive
// our port (it can only be sent once since the object ownership is transferred (neutered)),
// and we'll resend also the started message that will be received too for sure;
// the other end will thus receive the connect message, to which it reacts
// by listening to the port, and the started message, to which reacts
// by sending its connect message and its started message.
// Finally, we'll receive the connect message, to which we react by listening,
// and the started message again, that we'll just ignore.
// In the meantime, they both can send messages to the out ports, even if the other didn't
// received it yet, since the MessageChannel port start() method emits all the messages
// received until that moment.

var isConnectedWithPage = false;
var channel;
var pagePortOut;
var pagePortIn;

var initialize = function() {
	channel = new MessageChannel();
	pagePortOut = channel.port1;

	waitForPage();
	notifyStartToPage();
}

var waitForPage = function() {
	window.addEventListener('message', function(event) {
	    // Only accept messages from same frame
	    if (event.source != window) return;

	    var message = event.data;

	    // Only accept our messages
	    if (typeof message != 'object' || message === null || message.target != 'page') return;

	    if (message.name == 'started' && !isConnectedWithPage) {
	    	// now we are sure the other is ready to receive our port
	    	connectToPage();

	    	// this is needed if the content script started before the page
	    	// (in that case the inspected page never received the initial 'active' message)
	    	notifyStartToPage();
	    } else if (message.name == 'connect' && !pagePortIn) {
	    	pagePortIn = event.ports[0];

	    	listenToPage();
	    }
	});
}

var notifyStartToPage = function() {
	window.postMessage({
		target: 'extension',
		timestamp: new Date().getTime(),
		name: 'started'
	}, '*');
}

// this must be called only once since the port ownership is transferred (neutered) !
var connectToPage = function(connectMessage) {
	window.postMessage({
		target: 'extension',
		timestamp: new Date().getTime(),
		name: 'connect'
	}, [channel.port2], '*');

	isConnectedWithPage = true;
}

// Listens to inspected page frame messages and redirects them to the background,
// building up the first step towards the communication between the backbone agent and the panel.
var listenToPage = function() {
	pagePortIn.addEventListener('message', function(event) {
		var message = event.data;
		message.frameURL = frameURL;
		chrome.extension.sendMessage(message);
	});
	pagePortIn.start();
}

// Receives messages from the background and redirects them to the inspected page.
chrome.runtime.onMessage.addListener(function(message) {
	// Only accept messages for our frame
	if (message.frameURL != frameURL) return;

	pagePortOut.postMessage(message);
});

if (isTopFrame) {
	/* Code to be executed only if this is the top frame content script! */

	// Sends a message to the background when the DOM of the inspected page is ready
	// (typically used by the panel to check if the backbone agent is on the page).
	window.addEventListener('DOMContentLoaded', function() {
	    chrome.extension.sendMessage({
	        target: 'page',
	        name: 'ready'
	    });
	}, false);
}

initialize();