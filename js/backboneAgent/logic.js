//// LOGIC ////

debug.active = false; // true for backbone agent debug mode

// @private
// Patcha il metodo trigger del componente dell'app.
var patchAppComponentTrigger = bind(function(appComponentInfo) {
    patchFunctionLater(appComponentInfo.component, "trigger", function(originalFunction) { return function() {
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

        addAppComponentAction(appComponentInfo, {
            "type": "Trigger",
            "name": eventName,
            "dataKind": dataKind
        }, data);

        return result;
    };});
}, this);

// @private
// Patcha la proprietà _events del componente dell'app
// (contiene gli handler degli eventi backbone)
var patchAppComponentEvents = bind(function(appComponentInfo) {
    // TODO: funzione da rimuovere?
});

// @private
// Patcha il metodo sync del componente dell'app (presente in modelli e collezioni).
var patchAppComponentSync = bind(function(appComponentInfo) {
    patchFunctionLater(appComponentInfo.component, "sync", function(originalFunction) { return function() {

        var method = arguments[0]; // es. "create", "read", etc.

        var syncCompleted = function(isSuccess) {
            var syncStatus = isSuccess? "success" : "failure";
            var actionName = method + " ("+syncStatus+")"; // es. "fetch (failure)"

            setAppComponentAttribute(appComponentInfo, "component_status", actionName);

            addAppComponentAction(appComponentInfo, {
                "type": "Sync", 
                "name": actionName
            });
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

    var me = this;

    patchBackboneComponent(BackboneView, bind(function(view) { // on new instance

        var viewInfo = registerAppComponent("View", view, {
            "component_name": null, // string
            "component_modelIndex": null, // int
            "component_collectionIndex": null, // int
            "component_status": null // can be "Created", "Rendered" or "Removed"
        });

        // based on the constructor and on the el.tagName, el.id and el.className
        var updateViewName = function() {
            var viewSelector = "";
            if (isObject(view.el)) {
                if (typeof view.el.tagName == 'string' && view.el.tagName !== "") {
                    viewSelector += view.el.tagName.toLowerCase();
                }
                if (typeof view.el.id == 'string' && view.el.id !== "") {
                    viewSelector += "#"+view.el.id;
                }
                if (typeof view.el.className == 'string' && view.el.className !== "") {
                    viewSelector += "."+view.el.className.replace(/ /g, '.');
                }
            }
            var componentName = view.constructor.name || null;
            var componentNameDetails = viewSelector || null;
            if (componentName && componentNameDetails) {
                componentName += " - " + componentNameDetails;
            } else {
                componentName = componentName || componentNameDetails;
            }

            setAppComponentAttribute(viewInfo, "component_name", componentName);
        }

        // initial attributes
        setAppComponentAttribute(viewInfo, "component_status", "Created");
        updateViewName(); // is based also on the constructor!

        // monitor app component properties to update attributes

        monitorAppComponentProperty(view, "model", 0, function() {
            var componentModelInfo = me.getAppComponentInfo(viewInfo.component.model);
            var componentModelIndex = componentModelInfo? componentModelInfo.index : null;
            setAppComponentAttribute(viewInfo, "component_modelIndex", componentModelIndex);
        });

        monitorAppComponentProperty(view, "collection", 0, function() {
            var componentCollectionInfo = me.getAppComponentInfo(viewInfo.component.collection);
            var componentCollectionIndex = componentCollectionInfo? componentCollectionInfo.index : null;
            setAppComponentAttribute(viewInfo, "component_collectionIndex", componentCollectionIndex);
        });

        monitorAppComponentProperty(view, "el.tagName", 0, updateViewName, {stealth: true});
        monitorAppComponentProperty(view, "el.id", 0, updateViewName, {stealth: true});
        monitorAppComponentProperty(view, "el.className", 0, updateViewName, {stealth: true});

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(viewInfo);
        patchAppComponentEvents(viewInfo);

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

                            addAppComponentAction(viewInfo, {
                                "type": "Page event handling", 
                                "name": eventType,
                                "dataKind": "jQuery Event"
                            }, event);

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

            setAppComponentAttribute(viewInfo, "component_status", "Rendered");

            addAppComponentAction(viewInfo, {
                "type": "Operation",
                "name": "render"
            });

            return result;
        }});

        patchFunctionLater(view, "remove", function(originalFunction) { return function() {
            var result = originalFunction.apply(this, arguments);

            setAppComponentAttribute(viewInfo, "component_status", "Removed");

            addAppComponentAction(viewInfo, {
                "type": "Operation",
                "name": "remove"
            });

            return result;
        }});
    }, this));
}, this);

// @private
var patchBackboneModel = bind(function(BackboneModel) {
    debug.log("Backbone.Model detected");

    var me = this;

    patchBackboneComponent(BackboneModel, bind(function(model) { // on new instance

        var modelInfo = registerAppComponent("Model", model, {
            "component_name": null, // string
            "component_attributes": null, // hash <attributeName, attributeValue>
            "component_id": null,
            "component_cid": null,
            "component_url": null, // string
            "component_collectionIndex": null, // int
            "component_status": null // last sync status, e.g. "read (success)"
        });

        // based on the constructor and on the attributes property
        var updateModelName = function() {
            // e.g. "MyModel - modelTitle" or "MyModel" or modelTitle"
            var componentName = modelInfo.component.constructor.name || null;
            var componentNameDetails = modelInfo.component.attributes['name'] ||
                                       modelInfo.component.attributes['title'] || null;
            if (componentName && componentNameDetails) {
                componentName += " - " + componentNameDetails;
            } else {
                componentName = componentName || componentNameDetails;
            }
            setAppComponentAttribute(modelInfo, "component_name", componentName);
        }

        // initial attributes
        updateModelName(); // is based also on the constructor!

        // monitor app component properties to update attributes

        monitorAppComponentProperty(model, "attributes", 1, function() {
            // retrieves the model attributes (the backbone ones), replacing values which are objects
            // with {} or [] placeholders (based of if they are plain objects or arrays) 
            // (the real value can be printed in the console with the relative method, 
            // this way problems with serializing circular objects can be avoided)
            var attributes = {};
            var numAttributes = 0;
            var realAttributes = modelInfo.component.attributes;
            for (var attributeName in realAttributes) {
                if (realAttributes.hasOwnProperty(attributeName)) {
                    var attributeValue = realAttributes[attributeName];
                    if (isObject(attributeValue)) {
                        // placeholder
                        if (isArray(attributeValue)) {
                            attributeValue = [];
                        } else {
                            attributeValue = {};
                        }
                    }
                    attributes[attributeName] = attributeValue;
                    numAttributes++;
                }
            }
            if (numAttributes === 0) {
                attributes = null;
            }
            setAppComponentAttribute(modelInfo, "component_attributes", attributes);

            // the attributes are also used in the component name!
            updateModelName();
        });

        monitorAppComponentProperty(model, "id", 0, function() {
            setAppComponentAttribute(modelInfo, "component_id", modelInfo.component.id);
        });

        monitorAppComponentProperty(model, "cid", 0, function() {
            setAppComponentAttribute(modelInfo, "component_cid", modelInfo.component.cid);
        });

        // based on the urlRoot and collection properties.
        var updateModelUrl = function() {
            var url;
            try {
                // if the url can't be generated, the method will raise an exception
                url = modelInfo.component.url();
            } catch (exception) {
                url = null;
            }
            setAppComponentAttribute(modelInfo, "component_url", url);
        }

        monitorAppComponentProperty(model, "urlRoot", 0, updateModelUrl);

        monitorAppComponentProperty(model, "collection", 0, function() {
            var componentCollectionInfo = me.getAppComponentInfo(modelInfo.component.collection);
            var componentCollectionIndex = componentCollectionInfo? componentCollectionInfo.index : null;
            setAppComponentAttribute(modelInfo, "component_collectionIndex", componentCollectionIndex);

            // the collection is used also to generate the url!
            updateModelUrl();
        });

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(modelInfo);
        patchAppComponentEvents(modelInfo);
        patchAppComponentSync(modelInfo);
    }, this));
}, this);

// @private
var patchBackboneCollection = bind(function(BackboneCollection) {
    debug.log("Backbone.Collection detected");

    var me = this;

    patchBackboneComponent(BackboneCollection, bind(function(collection) { // on new instance

        var collectionInfo = registerAppComponent("Collection", collection, {
            "component_name": null, // string
            "component_hasModel": null, // bool, true if the collection has the model property setted
                                        // (with the type of the models)
            "component_models": null, // array with the indexes of the models contained in the collection
            "component_url": null, // string
            "component_status": null // last sync status, e.g. "read (success)"
        });

        // based on the constructor and on the url
        var updateCollectionName = function() {
            var componentName = collectionInfo.component.constructor.name ||
                                collectionInfo.attributes["component_url"] || null;
            setAppComponentAttribute(collectionInfo, "component_name", componentName);
        }

        // initial attributes
        updateCollectionName(); // is based also on the constructor!

        // monitor app component properties to update attributes

        monitorAppComponentProperty(collection, "model", 0, function() {
            var hasModel = collectionInfo.component.model !== undefined;
            setAppComponentAttribute(collectionInfo, "component_hasModel", hasModel);
        });

        monitorAppComponentProperty(collection, "models", 1, function() {
            var models = collectionInfo.component.models;
            var modelsIndexes = [];
            for (var i=0,l=models.length; i<l; i++) {
                var model = models[i];
                var modelIndex = me.getAppComponentInfo(model).index;
                modelsIndexes.push(modelIndex);
            }
            setAppComponentAttribute(collectionInfo, "component_models", modelsIndexes);
        });

        monitorAppComponentProperty(collection, "url", 0, function() {
            var url = collectionInfo.component.url;
            if (typeof url === "function") {
                // the url can be specified also as a function that returns it
                try {
                    // if the url can't be generated, the method couuld raise an exception (user defined)
                    url = url();
                } catch (exception) {
                    url = null;
                }
            }
            setAppComponentAttribute(collectionInfo, "component_url", url);

            // the url is used also to generate the name!
            updateCollectionName();
        });

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(collectionInfo);
        patchAppComponentEvents(collectionInfo);
        patchAppComponentSync(collectionInfo);
    }, this));
}, this);

// @private
var patchBackboneRouter = bind(function(BackboneRouter) {
    debug.log("Backbone.Router detected");

    var me = this;

    patchBackboneComponent(BackboneRouter, bind(function(router) { // on new instance

        var routerInfo = registerAppComponent("Router", router, {
            "component_name": null // string
        });

        // based on the constructor
        var updateRouterName = function() {
            var componentName = routerInfo.component.constructor.name || null;
            setAppComponentAttribute(routerInfo, "component_name", componentName);
        }

        // initial attributes
        updateRouterName(); // is based also on the constructor!

        // Patcha i metodi del componente dell'app

        patchAppComponentTrigger(routerInfo);
        patchAppComponentEvents(routerInfo);
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