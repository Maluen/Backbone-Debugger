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
                    this.reloadPanel();
                } else {
                    // if the inspected page still has the backbone agent, then the update isn't a 
                    // "real one" (e.g. is an hash change / push state, etc.) and we can ignore it.
                    // Note: as a side effect, if the agent isn't in the inspected page because we are
                    // in a waiting or debug disabled view, than the update is always considered as real
                    backboneAgentClient.isActive(_.bind(function(isActive) {
                        if (!isActive) { // the update is "real"
                            if (!this.debugMode) {
                                // the user refreshed the page while not in debug mode
                                // => reload the panel to show the view for activating debugging
                                this.reloadPanel();
                            } else {
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
            "restartAppInDebugMode": "restartAppInDebugMode",
            "stopDebugMode": "stopDebugMode"
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
                        // we are in debug mode even if we are still not connected
                        // (this allows auto-reinject on url change)
                        this.debugMode = true;

                        // Wait until Backbone is detected
                        // and the client is connected to the agent
                        waitingView.setWaitingText('Waiting for Backbone...');
                        backboneAgentClient.connect(_.bind(function() { // on connected
                            waitingView.remove();
                            var debuggerView = new DebuggerView();
                            document.body.appendChild(debuggerView.el);
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
        },

        reloadPanel: function() {
            window.location.href = "";
        },

        stopDebugMode: function() {
            this.debugMode = false;
            // this will also cause panel reload as a response, since we are no more in debug mode
            inspectedPageClient.reload();
        }

    });
    return Router;
});
