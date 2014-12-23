/*
 Note: the background is shared between the browser tabs, therefore it
 identifies the various panel communication ports by using the id of the
 tab they belong to.
*/

// Hash <panel tab id, panel commmunication port>
var panelPorts = {};
// Hash <panel tab id, panel frameURL>
var panelFrames = {};
// Hash <panel tab id, panel client index>
var panelClientIndexes = {};

// Panel registration
chrome.extension.onConnect.addListener(function(port) {
    if (port.name !== 'devtoolspanel') return;

    var tabId;

    port.onMessage.addListener(function(message) {
        if (message.name == 'identification') {
            tabId = message.data;
            panelPorts[tabId] = port;

            port.onDisconnect.addListener(function() {
                handlePanelDisconnect(tabId);
            });
        } else {
            handlePanelMessage(message, tabId);
        }
    });
});

var handlePanelMessage = function(message, tabId) {
    var port = panelPorts[tabId];

    // redirect the message to the respective content script(s)
    // Note: the message is sent to ALL the content scripts in the page
    // (e.g. one per frame), is duty of each content script to read or not the message.
    chrome.tabs.sendMessage(tabId, message);
};

var handlePanelDisconnect = function(tabId) {
    // send the disconnect message in behalf of the old panel
    // to the backbone agent server
    if (typeof panelClientIndexes[tabId] !== 'undefined') { // the panel was connected
        var details = {
            clientIndex: panelClientIndexes[tabId]
        };
        chrome.tabs.sendMessage(tabId, {
            target: 'extension',
            name: 'client:disconnect',
            timestamp: new Date().getTime(),
            data: details,
            frameURL: panelFrames[tabId]
        });
    }

    delete panelPorts[tabId];
    delete panelClientIndexes[tabId];
}

var handleContentScriptMessage = function(message, tabId) {
    var port = panelPorts[tabId];
    if (!port) return; // the panel doesn't exist anymore

    if (message.name == 'backboneAgent:connected') {
        // keep track of the client index and frameURL associated with the panel
        // so to be able to send the disconnect message
        var details = message.data;
        panelClientIndexes[tabId] = details.clientIndex;
        panelFrames[tabId] = message.frameURL;
    }

    // redirect the message to the respective panel,
    // completing the communication between the backbone agent and the panel.
    port.postMessage(message);
};

// Receives messages from the content scripts
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    if (sender.tab) {
        var tabId = sender.tab.id;
        handleContentScriptMessage(message, tabId);
    }
});

// Sends a message to the panels when the respective tabs are updated (refresh, url change, etc.)
// (tipically used by the panel to reload itself)
chrome.tabs.onUpdated.addListener(function(updatedTabId, changeInfo) {
    // the event is emitted a second time when the update is complete, but we only need the first one.
    if (changeInfo.status == 'loading') {
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
    if (details.reason == 'update') {
        chrome.tabs.create({url: chrome.extension.getURL('updated.html')});
    }
});
