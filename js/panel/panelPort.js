define([], function() {
    // Establish a bidiretional communication port with the background
    var tabId = chrome.devtools.inspectedWindow.tabId;
    var panelPort = chrome.runtime.connect({name: "devtoolspanel"});
    panelPort.postMessage({
        name: "identification",
        data: tabId
    });

    return panelPort;
});
