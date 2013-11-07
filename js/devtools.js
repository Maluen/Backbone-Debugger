// Script executed every time the devtools are opened.

// custom panel
chrome.devtools.panels.create("Backbone", "img/panel.png", "panel.html");

// custom sidebar pane in the elements panel
chrome.devtools.panels.elements.createSidebarPane("Backbone", function(sidebar) {
    chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
        sidebar.setHeight("35px");
        sidebar.setPage("elementsSidebar.html");
    });
});
