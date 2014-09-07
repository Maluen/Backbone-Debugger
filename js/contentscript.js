var frameURL = window.location.href;
var isTopFrame = (window.parent == window);

// Receives messages from the inspected page frame and redirects them to the background,
// building up the first step towards the communication between the backbone agent and the panel.
window.addEventListener("message", function(event) {
    // Only accept messages from same frame
    if (event.source != window) return;

    var message = event.data;

    // Only accept our messages
    if (typeof message != 'object' || message === null || message.target != 'page') return;

    message.frameURL = frameURL;
    chrome.extension.sendMessage(message);
}, false);

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
