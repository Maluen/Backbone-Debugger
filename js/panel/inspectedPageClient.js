define(["backbone", "underscore", "panelPort", "utils"], function(Backbone, _, panelPort, utils) {
    var inspectedPageClient = new (function() {
        _.extend(this, Backbone.Events);

        this.initialize = function() {
            _.bindAll(this);

            // true when the injection process is being executed, tipically used by the router
            // to decide whether to reload the panel or not.
            this.isInjecting = false;

            // Turn inspected page messages into Backbone events,
            // so that Backbone.Events methods like the useful "listenTo" can be used
            panelPort.onMessage.addListener(_.bind(function(message) {
                if (message && message.target == "page") {
                    this.trigger(message.name, message.data);
                }
            }, this));
        };

        // Execute the "func" function in the inspected page,
        // passing to it the arguments specified in the "args" array (that must be JSON-compatible),
        // a more specific context can be setted by using the "context" parameter.
        // The callback "onExecuted" is called with the function return value.
        // The method is implemented by using devtools.inspectedWindow.eval.
        this.execFunction = function(func, args, onExecuted, context) {
            if (context === undefined) { context = "this"; }

            var evalCode = "("+func.toString()+").apply("+context+", "+JSON.stringify(args)+");";
            chrome.devtools.inspectedWindow.eval(evalCode, function(result, isException) {
                if (isException) {
                    var error = _.isObject(isException) ? isException.value : result;
                    throw error;
                } else {
                    if (onExecuted) onExecuted(result);
                }
            });
        };

        // Call the callback when the inspected page DOM is fully loaded
        // or immediately if that is already true.
        this.ready = function(onReady) {
            this.execFunction(function() {
                var readyState = document.readyState;
                return (readyState != "uninitialized" && readyState != "loading");
            }, [], _.bind(function(hasLoaded) { // on executed
                if (hasLoaded) {
                    onReady();
                } else {
                    this.once("ready", onReady);
                }
            }, this));
        };

        // Reload the inspected page injecting at the beginning the scripts
        // whose absolute base path is specified in the "scriptsBasePath" string.
        // The scripts base directory must contain an index.json file with
        // a scripts array which will be injected in the provided order.
        // Note: the urls are considered as relative to the base path.
        // "injectionData" is an optional JSON-compatible hash accessible to the scripts,
        // is tipically used to pass special data not directly accessible from the page, such as the
        // extension url, or for scripts configuration options.
        this.reloadInjecting = function(scriptsBasePath, injectionData) {
            injectionData = injectionData || {};
            var me = this;

            utils.httpRequest("get", scriptsBasePath+"/index.json", function(data) {
                var index = JSON.parse(data);

                // transform scripts relative urls into their content
                var scripts = index.scripts;
                var fetchScripts = function(onComplete) {
                    var scriptsLoaded = 0;
                    _.each(scripts, function(scriptRelativeURL, index) {
                        var scriptURL = scriptsBasePath+"/"+scriptRelativeURL;
                        utils.httpRequest("get", scriptURL, function(data) {
                            scripts[index] = data; // replace script relative url with its content
                            scriptsLoaded++;

                            if (scriptsLoaded === scripts.length) {
                                // scripts fetch complete
                                onComplete(scripts);
                            }
                        });
                    });
                }
                fetchScripts(function() { // on complete
                    // prepare code to inject
                    // TODO: create and use source map to ease debugging

                    var toInject = '(function(injectionData) {' + '\n\n'
                                        + scripts.join('\n\n') + '\n\n'
                                + '})('+JSON.stringify(injectionData)+');' + '\n'; // last "\n" prevents eventual EOF error

                    // Reload the inspected page with the code to inject at the beginning of it
                    me.isInjecting = true;
                    chrome.devtools.inspectedWindow.reload({
                        ignoreCache: true, // avoid to load the old and possibly different 
                                           // cached version of the inspected page
                        injectedScript: toInject
                    });
                });
            }, true); // disable request caching (avoid to load the old and possibly different cached
                      // version of the injected scripts), not needed in production.
        };

        this.initialize();
    })();
    return inspectedPageClient;
});
