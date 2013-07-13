define(["backbone", "inspectedPageClient", "backboneAgentClient",
        "views/main/WaitingView", "views/main/DebuggerView", "views/main/DebugDisabledView"],
function(Backbone, inspectedPageClient, backboneAgentClient, WaitingView, DebuggerView, DebugDisabledView) {

    var Router = Backbone.Router.extend({

        initialize: function() {
            // Ricarica il panel quando viene aggiornata l'inspected page
            this.listenTo(inspectedPageClient, "updated", _.bind(function() {
                // attenzione, un semplice refresh del panel non basta: se l'url corrente
                // non è quello della home (poichè è cambiato nel corso della navigazione), 
                // dopo il refresh la route "" non verrà mai caricata, si deve quindi tornare alla home.
                window.location.href = "";
            }, this));
        },

        routes: {
            "": "start",
            "restartAppInDebugMode": "restartAppInDebugMode"
        },

        start: function() {
            var waitingView = new WaitingView();
            document.body.appendChild(waitingView.el);

            backboneAgentClient.isActive(_.bind(function(isActive) {
                waitingView.remove();

                if (isActive) {
                    var debuggerView = new DebuggerView();
                    document.body.appendChild(debuggerView.el);
                } else {
                    // Agent non attivo, carica la vista usata per attivarlo.
                    var debugDisabledView = new DebugDisabledView();
                    document.body.appendChild(debugDisabledView.el);
                }
            }, this));
        },

        restartAppInDebugMode: function() {
            backboneAgentClient.activate();
        }

    });
    return Router;
});
