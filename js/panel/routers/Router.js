define(["backbone", "inspectedPageClient", "backboneAgentClient",
        "views/main/WaitingView", "views/main/DebuggerView", "views/main/DebugDisabledView"],
function(Backbone, inspectedPageClient, backboneAgentClient, WaitingView, DebuggerView, DebugDisabledView) {

    var Router = Backbone.Router.extend({

        initialize: function() {
            // true if the debug mode is active, i.e. if the current view is the DebuggerView.
            // Used after a tab update to know if it's proper to reinject the backbone agent automatically
            // (see below)
            this.debugMode = false;

            this.listenTo(inspectedPageClient, "updated", _.bind(function(updateDetails) {
                if (inspectedPageClient.isInjecting) {
                    // we are injecting scripts into the inspected page
                    // => reload the panel to wait for injected scripts loading (i.e. backbone agent)
                    window.location.href = "";
                } else {
                    // if the inspected page still has the backbone agent, then the update isn't a 
                    // "real one" (e.g. is an hash change / push state, etc.) and we can ignore it.
                    // Note: as a side effect, if the agent isn't in the inspected page because we are
                    // in a waiting or debug disabled view, than the update is always considered as real
                    backboneAgentClient.isActive(_.bind(function(isActive) {
                        if (!isActive) { // the update is "real"
                            if (updateDetails.urlChanged || !this.debugMode) {
                                // the user moved to another page/app/site or refreshed the page
                                // while not in debug mode
                                // => reload the panel to show the view for activating debugging
                                window.location.href = "";
                            } else {
                                // the update is a refresh while in debug mode
                                // => reinject the backbone agent to keep the debug mode running
                                this.restartAppInDebugMode();
                            }
                        }
                    }, this));
                }
            }, this));
        },

        routes: {
            "": "start",
            "restartAppInDebugMode": "restartAppInDebugMode"
        },

        start: function() {
            var waitingView = new WaitingView();
            document.body.appendChild(waitingView.el);

            // Wait until the inspected page is ready, in order to wait the completion of 
            // an eventual Backbone Agent in-progress activation.
            waitingView.setWaitingText('Waiting for inspected page loading...');
            inspectedPageClient.ready(_.bind(function() {
                backboneAgentClient.isActive(_.bind(function(isActive) {
                    if (isActive) {
                        // Wait until Backbone is detected
                        waitingView.setWaitingText('Waiting for Backbone...');
                        backboneAgentClient.detectBackbone(_.bind(function() {
                            waitingView.remove();
                            var debuggerView = new DebuggerView();
                            document.body.appendChild(debuggerView.el);
                            this.debugMode = true;
                        }, this));
                    } else {
                        // Agent not active, show the view used to activate it.
                        waitingView.remove();
                        var debugDisabledView = new DebugDisabledView();
                        document.body.appendChild(debugDisabledView.el);
                    }
                }, this));
            }, this));
        },

        restartAppInDebugMode: function() {
            backboneAgentClient.activate();
        }

    });
    return Router;
});
