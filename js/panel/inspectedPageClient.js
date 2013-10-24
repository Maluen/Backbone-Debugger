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
                    throw result;
                } else {
                    onExecuted(result);
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

        // Reload the inspected page injecting at the beginning of it the scripts
        // whose url are specified in the "scripts" array,
        // "injectionData" is an optional JSON-compatible hash accessible to the injected scripts,
        // tipically used to pass special data not directly accessible from the page, such as the
        // extension url.
        this.reloadInjecting = function(scripts, injectionData) {
            var scriptsContents = []; // array with the content of each script
            var scriptsLoaded = 0;

            var realThis = this;

            for (var i=0,l=scripts.length; i<l; i++) {(function (i) { // each iteration has its closure with its own "i"
                // download the scripts asynchronously (the downloads completion order is random)
                utils.httpRequest("get", scripts[i], function(data) {
                    // script number i downloaded.

                    // by executing the script with eval instead that directly, it's possible to specify
                    // its url with the "sourceURL" special comment, making possible to debug it,
                    // not having to deal with a single mass of code containing all the injected scripts.
                    scriptsContents[i] = "eval("+JSON.stringify("//@ sourceURL="+scripts[i]+"\n"+data)+");";

                    scriptsLoaded++;
                    if (scriptsLoaded == scripts.length) {
                        // all the scripts have been downloaded

                        // join the scripts separating them with a carriage return.
                        var toInject = scriptsContents.join('\n')+"\n"; // last "\n" prevents EOF error 
                                                                        // when injecting a single file with 
                                                                        // no newline at the end

                        // prepend the injectionData
                        injectionData = (injectionData !== undefined) ? injectionData : {};
                        var injectionDataCode = "var injectionData = "+JSON.stringify(injectionData)+";\n";
                        toInject = injectionDataCode + toInject;

                        // Reload the inspected page with the scripts injected at the beginning of it
                        realThis.isInjecting = true;
                        chrome.devtools.inspectedWindow.reload({
                            ignoreCache: true, // avoid to load the old and possibly different 
                                               // cached version of the inspected page
                            injectedScript: toInject
                        });
                    }
                }, true); // disable request caching (avoid to load the old and possibly different cached
                          // version of the injected scripts), not needed in production.
            })(i);}
        };

        this.initialize();
    })();
    return inspectedPageClient;
});
