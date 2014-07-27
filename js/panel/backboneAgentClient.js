define(["backbone", "underscore", "inspectedPageClient"], function(Backbone, _, inspectedPageClient) {
    var backboneAgentClient = new (function() {
        _.extend(this, Backbone.Events);

        this.initialize = function() {
            _.bindAll(this);
        };

        // Call the callback passing to it a boolean indicating if the Backbone Agent is active.
        this.isActive = function(callback) {
            inspectedPageClient.execFunction(function() {
                return (window.__backboneAgent !== undefined);
            }, [], callback);
        };

        // Activate the Backbone Agent by reloading the inspected page and injecting it at
        // the beginning.
        this.activate = function() {
            inspectedPageClient.reloadInjecting(chrome.extension.getURL("js/backboneAgent"));
        };

        // Execute the passed function in the inspected page using the Backbone Agent as context.
        this.execFunction = function(func, args, onExecuted) {
            inspectedPageClient.execFunction(func, args, onExecuted, "window.__backboneAgent");
        };

        this.initialize();
    })();
    return backboneAgentClient;
});
