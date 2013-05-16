define([], function() {
    // Stabilisce una connessione bidirezionale con il background
    var tabId = chrome.devtools.inspectedWindow.tabId;
    var panelPort = chrome.extension.connect({name: "devtoolspanel"});
    panelPort.postMessage({
        name: 'identification',
        data: tabId
    });

    return panelPort;
});