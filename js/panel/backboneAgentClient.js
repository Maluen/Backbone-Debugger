define(["backbone", "underscore", "inspectedPageClient"], function(Backbone, _, inspectedPageClient) {
    var backboneAgentClient = new (function() {
        _.extend(this, Backbone.Events);

        this.context = "window.__backboneAgent";

        // sent by the backbone agent server when connected
        // as an identifier for the client and for its dedicated server.
        this.clientIndex = undefined;

        this.initialize = function() {
            _.bindAll(this);

            // the frame url in which Backbone has been detected
            this.frameURL = undefined;
        };

        // Call the callback passing to it a boolean indicating if the Backbone Agent is active.
        this.isActive = function(callback) {
            // the agent is injected into every frame,
            // thus is sufficient to check if exists on one of them, like on the top frame.
            // (the inspectedPageClient is used directly to be sure of executing the function
            // on the top frame without having to pass its url after having detected Backbone)
            inspectedPageClient.execFunction(function() {
                // can't pass directly this.context as context and do "this !== undefined"
                // since the code isn't executed in strict-mode, an undefined context would be
                // transformed into the window object.
                return (window.__backboneAgent !== undefined);
            }, [], callback);
        };

        // Activate the Backbone Agent by reloading the inspected page and injecting it at
        // the beginning of each frame.
        this.activate = function() {
            inspectedPageClient.reloadInjecting(chrome.extension.getURL("js/backboneAgent"));
        };

        // Execute the function in the inspected page, using the Backbone agent as context.
        // If the frameURL parameter is omitted, the default frame will be used (this.frameURL),
        // thus is not be possible to execute functions in the top frame by passing undefined
        // if the default value is not! Nevertheless, after having detected Backbone,
        // this will allow by default to execute functions in the frame where Backbone was found.
        this.execFunction = function(func, args, onExecuted, frameURL) {
            if (!frameURL) frameURL = this.frameURL;
            inspectedPageClient.execFunction(func, args, onExecuted, this.context, frameURL);
        };

        // Call the callback with the frame url in which Backbone has been detected
        // or with null if not detected yet.
        this.getBackboneFrame = function(callback) {

            var process = _.bind(function(frame, callback) {
                this.execFunction(function() {
                    return (window.__backboneAgent !== undefined) && 
                            window.__backboneAgent.isBackboneDetected;
                }, [], callback, frame.url);
            }, this);

            var processAll = _.bind(function(frames, index) {
                index = index || 0;
                
                if (index >= frames.length) {
                    // not found
                    callback(null);
                    return;
                }

                // process current
                process(frames[index], _.bind(function(isBackboneDetected) {
                    if (!isBackboneDetected) {
                        // process next
                        processAll(frames, index+1);
                    } else {
                        // found
                        callback(frames[index]);
                    }
                }, this));
            }, this);

            inspectedPageClient.getFrames(processAll);
        };

        // Find the first backboneAgent instance in which Backbone has been detected (or wait for it)
        // and save its frame url in order to execute code and receive messages only on/from it.
        // onDetected is an optional function to be called when the detection is done.
        this.detectBackbone = function(onDetected) {
            // Detect if there is a frame with backbone, if not, wait for it.
            // Since the backboneDetected event could arrive while checking the current frames,
            // is necessary to listen for it since from the start.

            // function to be called with the backbone frame that has been found
            var onBackboneFrame = _.once(_.bind(function(frameURL) { // assures single execution
                // if existing backbone was found, remove the pending listener for future backbone
                this.stopListening.apply(this, backboneDetectedListener);

                this.frameURL = frameURL; // execute code on backbone frame by default
                this.listenTo(inspectedPageClient, "all", _.bind(function(name, message) {
                    // re-trigger only events of the backbone agent instance
                    // that is in the backbone frame
                    var isValidMessage = message.frameURL == this.frameURL &&
                                         message.name.indexOf("backboneAgent:") == 0; // starts with
                    if (isValidMessage) {
                        this.trigger.apply(this, arguments);
                    }
                }, this));

                if (onDetected) onDetected();
            }, this));

            // wait for future backbone
            var backboneDetectedListener = [
                inspectedPageClient, 
                "backboneAgent:backboneDetected",
                function(message) { 
                    onBackboneFrame(message.frameURL); 
                }
            ];
            this.listenToOnce.apply(this, backboneDetectedListener);

            // get (eventual) existing backbone
            this.getBackboneFrame(_.bind(function(frame) {
                if (frame) onBackboneFrame(frame.url);
            }, this));
        };

        this.connect = function(onConnected) {
            this.detectBackbone(_.bind(function() { // on detected
                // connect to the server of the detected backbone agent
                this.listenToOnce(this, 'backboneAgent:connected', function(message) {
                    var details = message.data;
                    this.clientIndex = details.clientIndex;
                    if (onConnected) onConnected();
                });
                inspectedPageClient.sendMessage('connect', this.frameURL);
            }, this));
        };

        this.initialize();
    })();
    return backboneAgentClient;
});
