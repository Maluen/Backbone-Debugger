// Script executed every time an element is selected in the devtools elements panel.

// Function executed in the context of the inspected page, returns true if
// the backbone agent is active
var isBackboneAgentActive = function() {
    return window.__backboneAgent !== undefined;
};

// Function executed in the context of the inspected page, the function has access
// to the $0 variable containing the selected element in the devtools elements panel.
// Returns the corresponding view index if exists, otherwise returns undefined.
// Note: assumes that the backbone agent is active.
var getViewIndex = function() {
    var viewInfo = window.__backboneAgent.getAppViewInfoFromElement($0);
    return viewInfo? viewInfo.index : undefined;
};

window.onload = function() {
    // check if the backbone agent is active
    chrome.devtools.inspectedWindow.eval("("+isBackboneAgentActive+")()", function(result, isException) {
        if (isException) throw result;
        if (!result) {
            // the backbone agent is inactive, stop (the sidebar pane remains empty)
            return;
        }

        // retrieve the view index associated to the selected element
        chrome.devtools.inspectedWindow.eval("("+getViewIndex+")()", function(result, isException) {
            if (isException) throw result;

            var viewIndex = result;
            // show the view index in the sidebar pane
            var backboneView = document.getElementById("backboneView");
            backboneView.innerHTML = (viewIndex !== undefined) ? viewIndex : "none";
            var viewIndexContainer = document.getElementById("backboneViewContainer");
            viewIndexContainer.style.display = "block";
        });
    });
};
