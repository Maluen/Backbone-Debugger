// Script caricato ad ogni apertura dei devtools.

// custom panel
chrome.devtools.panels.create("Backbone Debugger", "img/panel.png", "panel.html");

// custom sidebar nel pannello Elements
chrome.devtools.panels.elements.createSidebarPane("Backbone Debugger", function(sidebar) {
    chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
    	sidebar.setHeight("35px");
    	sidebar.setPage("elementsSidebar.html");
    });
});