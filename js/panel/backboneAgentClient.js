define(["backbone", "underscore", "inspectedPageClient"], function(Backbone, _, inspectedPageClient) {
    var backboneAgentClient = new (function() {
        _.extend(this, Backbone.Events);

        this.initialize = function() {
            _.bindAll(this);
        };

        // Call the callback when the inspected page is ready, passing to it a boolean
        // indicating if the Backbone Agent is active.
        this.isActive = function(callback) {
            // Wait until the inspected page is ready, in order to wait the completion of 
            // an eventual Backbone Agent in-progress activation.
            inspectedPageClient.ready(function() {
                inspectedPageClient.execFunction(function() {
                    return (window.__backboneAgent !== undefined);
                }, [], callback);
            });
        };

        // Activate the Backbone Agent by reloading the inspected page and injecting it at
        // the beginning.
        this.activate = function() {
            /*
            inspectedPageClient.reloadInjecting([
                chrome.extension.getURL("js/lib/watch.js"),
                chrome.extension.getURL("js/lib/Object.observe.poly.js"),
                chrome.extension.getURL("js/backboneAgent.js")
            ]);
            */
            inspectedPageClient.reloadInjecting([
                chrome.extension.getURL("js/backboneAgent/loader.js")
            ], {
                "extensionUrl": chrome.extension.getURL("")
            });
        };

        // Execute the passed function in the inspected page using the Backbone Agent as context.
        this.execFunction = function(func, args, onExecuted) {
            inspectedPageClient.execFunction(func, args, onExecuted, "window.__backboneAgent");
        };

        this.initialize();
    })();
    return backboneAgentClient;
});