//// LOGIC ////

debug.active = false; // true for backbone agent debug mode

// @private
// Patcha il metodo trigger del componente dell'app.
var patchAppComponentTrigger = bind(function(appComponent) {
    patchFunctionLater(appComponent, "trigger", function(originalFunction) { return function() {
        var result = originalFunction.apply(this, arguments);

        // function signature: trigger(eventName, arg1, arg2, ...) 
        var eventName = arguments[0];
        var eventArguments = undefined;
        if (arguments.length > 1) { // the event has arguments
            // get the event arguments by skipping the first function argument (i.e the event name)
            eventArguments = Array.prototype.slice.call(arguments, 1);
        }
        // save data only if there is
        var data = eventArguments;
        var dataKind = (data === undefined) ? undefined : "event arguments";

        addAppComponentAction(this, new AppComponentAction(
            "Trigger", eventName, data, dataKind
        ));

        return result;
    };});
}, this);

// @private
// Patcha la proprietà _events del componente dell'app
// (contiene gli handler degli eventi backbone)
var patchAppComponentEvents = bind(function(appComponent) {
    // TODO: funzione da rimuovere?
});

// @private
// Patcha il metodo sync del componente dell'app (presente in modelli e collezioni).
var patchAppComponentSync = bind(function(appComponent) {
    patchFunctionLater(appComponent, "sync", function(originalFunction) { return function() {

        var method = arguments[0]; // es. "create", "read", etc.

        var syncCompleted = function(isSuccess) {
            var syncStatus = isSuccess? "success" : "failure";
            var actionName = method + " ("+syncStatus+")"; // es. "fetch (failure)"

            addAppComponentAction(appComponent, new AppComponentAction("Sync", actionName));
        };

        // arguments[2] è un hash con le opzioni
        // lo modifica al volo per essere informato sull'esito della sync
        var argumentsArray = Array.prototype.slice.call(arguments);
        if (argumentsArray[2] === undefined) { // il parametro è opzionale
            argumentsArray[2] = {};
        }
        patchFunction(argumentsArray[2], "success", function(originalFunction) { return function() {
            syncCompleted(true);
            if (originalFunction) { // la proprietà è opzionale
                return originalFunction.apply(this, arguments);
            }
        };});
        patchFunction(argumentsArray[2], "failure", function(originalFunction) { return function() {
            syncCompleted(false);
            if (originalFunction) { // la proprietà è opzionale
                return originalFunction.apply(this, arguments);
            }
        };});
        var result = originalFunction.apply(this, argumentsArray);
        return result;
    };});
}, this);

// @private
var patchBackboneView = bind(function(BackboneView) {
    debug.log("Backbone.View detected");

    patchBackboneComponent(BackboneView, bind(function(view) { // on new instance
        // registra il nuovo componente dell'app
        var viewIndex = registerAppComponent("View", view);

        // monitora i cambiamenti alle proprietà d'interesse del componente dell'app
        monitorAppComponentProperty(view, "model", 0);
        monitorAppComponentProperty(view, "collection", 0);
        monitorAppComponentProperty(view, "el.tagName", 0, {stealth: true});
        monitorAppComponentProperty(view, "el.id", 0, {stealth: true});
        monitorAppComponentProperty(view, "el.className", 0, {stealth: true});

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(view);
        patchAppComponentEvents(view);

        patchFunctionLater(view, "delegateEvents", function(originalFunction) { return function() {
            var events = arguments[0]; // hash <selector, callback>
            if (events === undefined) {
                // delegateEvents usa internamente this.events se viene chiamata senza
                // argomenti, non rendendo possibile la modifica dell'input, 
                // per cui in questo caso anticipiamo il comportamento e usiamo this.events
                // come input.
                // (this.events può essere anche una funzione che restituisce l'hash)
                events = (typeof this.events == "function") ? this.events() : this.events;
            }

            // bisogna modificare al volo le callback in events
            // per poter tracciare quando vengono chiamate
            events = clone(events); // evita di modificare l'oggetto originale
            for (var eventType in events) {
                if (events.hasOwnProperty(eventType)) {
                    // la callback può essere direttamente una funzione o il nome di una
                    // funzione nella view
                    var callback = events[eventType];
                    if (typeof callback != "function") {
                        callback = this[callback];
                    }
                    if (!callback) {
                        // lascia la callback non valida invariata in modo che 
                        // il metodo originale possa avvisare dell'errore
                        continue;
                    }

                    // callback valida, la modifica al volo
                    // (ogni funzione ha la sua closure con i dati dell'evento)
                    events[eventType] = (function(eventType, callback) {
                        return function(event) {
                            // event è l'evento jquery

                            addAppComponentAction(view, new AppComponentAction(
                                "Page event handling", eventType, event, "jQuery Event"
                            ));

                            var result = callback.apply(this, arguments);
                            return result;
                        }
                    })(eventType, callback);
                }
            }

            // modifica gli argomenti (non basta settare arguments[0] in quanto non funziona
            // nella strict mode)
            var argumentsArray = Array.prototype.slice.call(arguments);
            argumentsArray[0] = events;
            var result = originalFunction.apply(this, argumentsArray);

            return result;
        }});

        patchFunctionLater(view, "render", function(originalFunction) { return function() {
            var result = originalFunction.apply(this, arguments);

            addAppComponentAction(this, new AppComponentAction(
                "Operation", "render"
            ));

            return result;
        }});

        patchFunctionLater(view, "remove", function(originalFunction) { return function() {
            var result = originalFunction.apply(this, arguments);

            addAppComponentAction(this, new AppComponentAction(
                "Operation", "remove"
            ));

            return result;
        }});
    }, this));
}, this);

// @private
var patchBackboneModel = bind(function(BackboneModel) {
    debug.log("Backbone.Model detected");

    patchBackboneComponent(BackboneModel, bind(function(model) { // on new instance
        // registra il nuovo componente dell'app
        var modelIndex = registerAppComponent("Model", model);

        // monitora i cambiamenti alle proprietà d'interesse del componente dell'app
        monitorAppComponentProperty(model, "attributes", 1);
        monitorAppComponentProperty(model, "id", 0);
        monitorAppComponentProperty(model, "cid", 0);
        monitorAppComponentProperty(model, "urlRoot", 0); // usato dal metodo url() (insieme a collection)
        monitorAppComponentProperty(model, "collection", 0);

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(model);
        patchAppComponentEvents(model);
        patchAppComponentSync(model);
    }, this));
}, this);

// @private
var patchBackboneCollection = bind(function(BackboneCollection) {
    debug.log("Backbone.Collection detected");

    patchBackboneComponent(BackboneCollection, bind(function(collection) { // on new instance
        // registra il nuovo componente dell'app
        var collectionIndex = registerAppComponent("Collection", collection);

        // monitora i cambiamenti alle proprietà d'interesse del componente dell'app
        monitorAppComponentProperty(collection, "model", 0);
        monitorAppComponentProperty(collection, "models", 1);
        monitorAppComponentProperty(collection, "url", 0);

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(collection);
        patchAppComponentEvents(collection);
        patchAppComponentSync(collection);
    }, this));
}, this);

// @private
var patchBackboneRouter = bind(function(BackboneRouter) {
    debug.log("Backbone.Router detected");

    patchBackboneComponent(BackboneRouter, bind(function(router) { // on new instance
        // registra il nuovo componente dell'app
        var routerIndex = registerAppComponent("Router", router);

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(router);
        patchAppComponentEvents(router);
    }, this));
}, this);

// @private
// Calls the callback passing to it the Backbone object every time it's detected.
// The function uses multiple methods of detection.
var onBackboneDetected = function(callback) {
    var handleBackbone = function(Backbone) {
        // skip if already detected
        // (needed because the app could define Backbone in multiple ways at once)
        if (getHiddenProperty(Backbone, "isDetected")) return;
        setHiddenProperty(Backbone, "isDetected", true);

        callback(Backbone);
    }

    // global
    onSetted(window, "Backbone", handleBackbone);

    // AMD
    patchFunctionLater(window, "define", function(originalFunction) { return function() {
        // function arguments: (id? : String, dependencies? : Array, factory : Function)

        // make arguments editable
        var argumentsArray = Array.prototype.slice.call(arguments);
        // find the factory function to patch it
        for (var i=0,l=argumentsArray.length; i<l; i++) {
            if (typeof argumentsArray[i] == "function") {
                // factory function found, patch it.
                // NOTE: in the patcher function, specify the parameters for the
                // default modules, or in case of a module with no dependencies but
                // that uses the default modules internally, the original define would see a 0-arity
                // function and would call it without them (see define() in the AMD API)
                patchFunction(argumentsArray, i, function(originalFunction) {
                return function(require, exports, modules) {
                    var module = originalFunction.apply(this, arguments);

                    // check if Backbone has been defined by the factory fuction
                    // (some factories set "this" to Backbone)
                    var BackboneCandidate = module || this;
                    var isBackbone = isObject(BackboneCandidate) &&
                                     typeof BackboneCandidate.View == "function" &&
                                     typeof BackboneCandidate.Model == "function" &&
                                     typeof BackboneCandidate.Collection == "function" &&
                                     typeof BackboneCandidate.Router == "function";
                    if (isBackbone) {
                        handleBackbone(BackboneCandidate);
                    }

                    return module;
                }});

                break;
            }
        }
        return originalFunction.apply(this, argumentsArray);
    }});
};

// @private
// Metodo eseguito automaticamente all'atto della creazione dell'oggetto.
var initialize = function() {
    debug.log("Backbone agent is starting...");

    onBackboneDetected(function(Backbone) {
        debug.log("Backbone detected: ", Backbone);
        // note: the Backbone object might be only partially defined.
        onceDefined(Backbone, "View", patchBackboneView);
        onceDefined(Backbone, "Model", patchBackboneModel);
        onceDefined(Backbone, "Collection", patchBackboneCollection);
        onceDefined(Backbone, "Router", patchBackboneRouter);
    });
};

initialize();