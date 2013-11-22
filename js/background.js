/*
 Note: the background is shared between the browser tabs, therefore it
 identifies the various panel communication ports by using the id of the
 tab they belong to.
*/

// Hash <panel tab id, panel commmunication port>
var panelPorts = {};

// Panel registration
chrome.extension.onConnect.addListener(function(port) {
    if (port.name !== "devtoolspanel") return;

    port.onMessage.addListener(function(message) {
        if (message.name == "identification") {
            var tabId = message.data;
            panelPorts[tabId] = port;
        }
    });
});

// Receives messages from the content scripts and redirects them to the respective panels,
// completing the communication between the backbone agent and the panel.
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    if (sender.tab) {
        var port = panelPorts[sender.tab.id];
        if (port) {
            port.postMessage(message);
        }
    }
});

// Sends a message to the panels when the respective tabs are updated (refresh, url change, etc.)
// (tipically used by the panel to reload itself)
chrome.tabs.onUpdated.addListener(function(updatedTabId, changeInfo) {
    // the event is emitted a second time when the update is complete, but we only need the first one.
    if (changeInfo.status == "loading") {
        var port = panelPorts[updatedTabId];
        if (port) {
            port.postMessage({
                target: 'page',
                name: 'updated',
                data: {
                    urlChanged: changeInfo.url !== undefined
                }
            });
        }
    }
});

// Open a notification page when the extension gets updated
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "update") {
        chrome.tabs.create({url: chrome.extension.getURL("updated.html")});
    }
});
