window.__backboneAgent = new (function() {

    //// METODI DI UTILITÀ ////

    // @private
    // backbone agent debugging library
    var debug = {
        active: false, // set to true to activate debugging
        log: function() {
            if (!this.active) return;
            console.log.apply(console, arguments);
        }
    }

    // @private
    // Imposta il this nella funzione func pari all'oggetto scope.
    var bind = function(func, scope) {
        return function() {
            return func.apply(scope, arguments);
        };
    };

    // @private
    // Nota: null non è considerato un oggetto.
    var isObject = function(target) {
        return typeof target == "object" && target !== null;
    };

    // @private
    var isArray = function(object) {
        return Object.prototype.toString.call(object) == '[object Array]';
    };

    // @private
    // Restituisce un clone dell'oggetto passato.
    // N.B: le sottoproprietà non saranno clonate (shallow clone).
    var clone = function(object) {
        if (!isObject(object)) return object;
        if (isArray(object)) return object.slice();

        var newObject = {};
        for (var prop in object) {
          newObject[prop] = object[prop];
        }
        return newObject;
    };

    // @private
    var watchOnce = function(object, property, callback) {
        watch(object, property, function onceHandler(prop, action, newValue, oldValue) {
            // facendo l'unwatch prima di chiamare la callback (invece di farlo dopo),
            // è possibile in quest'ultima impostare la proprietà property 
            // senza incorrere in un loop infinito.
            unwatch(object, property, onceHandler);

            callback(prop, action, newValue, oldValue);
        });
    };

    // @private
    // Esegue la callback ogni volta che viene settata la proprietà property sull'oggetto object.
    // Nota: alla callback viene passato il valore settato.
    var onSetted = function(object, property, callback) {
        watch(object, property, function(prop, action, newValue, oldValue) {
            if (action == "set") { callback(newValue); }
        }, 0);
    };

    // @private
    // Come la onSetted, ma la callback viene chiamata solo LA PRIMA VOLTA che la proprietà è settata.
    var onceSetted = function(object, property, callback) {
        watchOnce(object, property, function(prop, action, newValue, oldValue) {
            if (action == "set") { callback(newValue); }
        }, 0);
    };

    // @private
    // Utilizza le librerie watch.js e Object.observe.poly.js per monitorare i set
    // della proprietà property di object e delle sue sottoproprietà, comprese quelle che
    // non sono presenti all'avvio del watching in quanto aggiunte successivamente.
    // Il livello di profondità del watching è specificato da recursionLevel (come in watch.js):
    // undefined => ricorsione completa, 0 => no ricorsione (solo il livello 0), n>0 => dal livello 0 al livello n)
    var onSettedDeep = function(object, property, onChange, recursionLevel) {

        // funzione per monitorare le sottoproprietà, esistenti e aggiunte successivamente
        var handleSubProperties = function(parentObject) {
            if (recursionLevel !== 0 && isObject(parentObject)) {
                var subRecursionLevel = (recursionLevel===undefined)? recursionLevel : recursionLevel-1;

                // monitora le sottoproprietà esistenti
                for (var subProperty in parentObject) {
                    if (parentObject.hasOwnProperty(subProperty)) {
                        onSettedDeep(parentObject, subProperty, onChange, subRecursionLevel);
                    }
                }

                // monitora le sottoproprietà aggiunte successivamente
                Object.observe(object[property], function(updates) {
                    for (var i=0,l=updates.length; i<l; i++) {
                        var update = updates[i];
                        var subProperty = update.name;

                        if (update.type == "new") { // nuova sottoproprietà
                            onSettedDeep(parentObject, subProperty, onChange, subRecursionLevel);

                            onChange();
                        }
                    }
                });
            }
        };

        // monitora i set della property
        onSetted(object, property, function() {
            // monitora i set per le sottoproprietà del nuovo (eventuale) oggetto settato
            handleSubProperties(object[property]);

            onChange();
        });

        // monitora i set delle sottoproprietà
        handleSubProperties(object[property]);
    };

    // @private
    // Like onSetted, but calls the callback every time object[property] is setted to a non
    // undefined value and also immediately if it's already non-undefined.
    var onDefined = function(object, property, callback) {
        if (object[property] !== undefined) callback(object[property]);
        onSetted(object, property, function(newValue) {
            if (newValue !== undefined) callback(newValue);
        });
    };

    // @private
    // Like onDefined, but calls the callback just once.
    var onceDefined = function(object, property, callback) {
        if (object[property] !== undefined) callback(object[property]);
        watch(object, property, function handler(prop, action, newValue, oldValue) {
            if (newValue !== undefined) {
                unwatch(object, property, handler);

                callback(newValue);
            }
        });
    };

    // @private
    // Sostituisce la funzione functionName di object con quella restituita dalla funzione patcher.
    // La funzione patcher viene chiamata con la funzione originale come argomento.
    var patchFunction = function(object, functionName, patcher) {
        var originalFunction = object[functionName];
        object[functionName] = patcher(originalFunction);
    };

    // @private
    // Come patchFunction, ma aspetta che il metodo sia definito se questo è undefined al momento
    // della chiamata.
    var patchFunctionLater = function(object, functionName, patcher) {
        if (object[functionName] === undefined) {
            onceDefined(object, functionName, function() {
                patchFunction(object, functionName, patcher);
            });
        } else {
            patchFunction(object, functionName, patcher);
        }
    };

    ////

    // @private
    // Azione di un componente dell'app.
    var AppComponentAction = function(type, name, data, dataKind) {

        this.timestamp = new Date().getTime();
        this.type = type; // stringa
        this.name = name; // stringa
        this.data = data; // oggetto
        // obbligatorio se data è definito, può essere
        // - "jQuery Event": data è l'oggetto relativo ad un evento jQuery
        // - "event arguments": data è un array di argomenti di un evento Backbone
        this.dataKind = dataKind;

        //// Metodi di utilità ////

        // stampa nella console le informazioni sull'azione
        this.printDetailsInConsole = function() {
        };
    };

    // @private
    var AppComponentInfo = function(category, index, component, actions) {

        // nome del componente Backbone di cui questo componente dell'app è un discendente.
        // I valori validi sono "View", "Model", "Collection", "Router"
        this.category = category;
        // usato come identificatore tra tutti i componenti dell'app della sua categoria
        this.index = index;

        this.component = component; // oggetto
        this.actions = actions || []; // array di oggetti AppComponentAction
    };

    // @private
    // All'atto dell'istanziazione di un componente, l'agent gli assegna
    // un indice che lo identifica all'interno dei vari array
    // riguardanti i componenti di quella categoria.
    // Tale indice viene calcolato incrementando quello dell'ultimo componente
    // della propria categoria.
    var lastAppComponentsIndex = {
        "View": -1,
        "Model": -1,
        "Collection": -1,
        "Router": -1
    };

    //// API PUBBLICA ////

    // Informazioni sui componenti dell'applicazione.
    // Hash <"componentCategory", [AppComponentInfo]>.
    // (Gli indici degli array sono quelli dei componenti.)
    this.appComponentsInfo = {
        "View": [],
        "Model": [],
        "Collection": [],
        "Router": []
    };

    // Restituisce un array con gli indici dei componenti dell'applicazione
    // della categoria specificata che sono presenti nell'app.
    this.getAppComponentsIndexes = bind(function(appComponentCategory) {
        var appComponentsInfo = this.appComponentsInfo[appComponentCategory];

        var appComponentsIndexes = [];
        for (var appComponentIndex in appComponentsInfo) {
            if (appComponentsInfo.hasOwnProperty(appComponentIndex)) {
                appComponentsIndexes.push(appComponentIndex);
            }
        }
        return appComponentsIndexes;
    }, this);

    // Restituisce l'oggetto di tipo AppComponentInfo con le informazioni sul componente dell'app passato
    // o undefined se l'oggetto passato non è un componente valido.
    this.getAppComponentInfo = bind(function(appComponent) {
        return getHiddenProperty(appComponent, "appComponentInfo");
    }, this);

    this.getAppComponentInfoByIndex = bind(function(appComponentCategory, appComponentIndex) {
        var appComponentInfo = this.appComponentsInfo[appComponentCategory][appComponentIndex];
        return appComponentInfo;
    }, this);

    // Restituisce l'info della vista a cui appartiene l'elemento html passato, o undefined se non esiste.
    // L'elemento appartiene alla vista se questo combacia perfettamente con la sua proprietà el, o 
    // se questa è l'ascendente più vicino rispetto a tutte le altre viste.
    this.getAppViewInfoFromElement = bind(function(pageElement) {
        // funzione che controlla se l'elemento html target è un ascendente dell'elemento html of
        var isAscendant = function(target, of) {
            if (!of) return false;

            var ofParent = of.parentNode;
            if (target === ofParent) return true;
            return isAscendant(target, ofParent);
        };

        // cerca il miglior candidato
        var candidateViewInfo;
        var viewsIndexes = this.getAppComponentsIndexes("View");
        for (var i=0,l=viewsIndexes.length; i<l; i++) {
            var currentViewInfo = this.getAppComponentInfoByIndex("View", viewsIndexes[i]);
            var currentView = currentViewInfo.component;

            if (currentView.el === pageElement) {
                // candidato perfetto trovato
                candidateViewInfo = currentViewInfo;
                break;
            }
            // l'el di currentView è un ascendente di pageElement ed è un discendente del miglior
            // candidato trovato finora?
            var candidateView = candidateViewInfo? candidateViewInfo.component : undefined;
            var isBetterCandidate = isAscendant(currentView.el, pageElement) &&
                                   (!candidateView || isAscendant(candidateView.el, currentView.el));
            if (isBetterCandidate) {
                // candidato migliore trovato
                candidateViewInfo = currentViewInfo;
            }
        }
        return candidateViewInfo;
    }, this);

    //// Metodi per impostare proprietà "nascoste" all'interno degli oggetti 
    //// (tipicamente usati per memorizzare l'AppComponentInfo di un dato componente dell'app
    ////  o i dati riguardanti l'initialize patchata nei componenti backbone)

    // NOTA DI SVILUPPO: non memorizzare le proprietà nascoste in oggetti contenitori 
    // in quanto sarebbero condivise da tutti i cloni / istanze e sottotipi
    // (quest'ultime in caso di proprietà nascoste impostate nel prototype del tipo), 
    // infatti gli oggetti sono copiati per riferimento.

    // @private
    // Prefisso dei nomi delle proprietà nascoste
    var hiddenPropertyPrefix = "__backboneDebugger__";
    // @private
    var getHiddenProperty = function(object, property) {
        if (!isObject(object)) return;
        return object[hiddenPropertyPrefix+property];
    };
    // @private
    var setHiddenProperty = function(object, property, value) {
        if (!isObject(object)) return;
        object[hiddenPropertyPrefix+property] = value;
    };

    ////

    // @private
    // instancePatcher è una funzione che viene chiamata ad ogni istanziazione del componente Backbone
    // specificato (e dei suoi sottotipi), passandogli la nuova istanza.
    // I componenti Backbone validi sono Backbone.View, Backbone.Model, Backbone.Collection e Backbone.Router
    // N.B: suppone che il componente backbone sia stato settato solo inizialmente.
    var patchBackboneComponent = bind(function(BackboneComponent, instancePatcher) {
        onceDefined(BackboneComponent, "extend", function() {
            // (l'extend è l'ultimo metodo impostato, quindi ora il componente è pronto)

            // Patcha la initialize del componente (e dei suoi sottotipi) per intercettare
            // le istanze create, il meccanismo quindi funziona se i sottotipi non definiscono
            // costruttori custom che non chiamano la initialize.

            var patchInitialize = function(originalInitialize) {
                return function() {
                    // Patcha l'istanza se non è già stato fatto
                    // (se ad es. l'istanza chiama l'initialize definita nel padre, evita
                    // di patcharla due volte)
                    var isInstancePatched = getHiddenProperty(this, "isInstancePatched");
                    if (!isInstancePatched) {
                        instancePatcher(this);
                        setHiddenProperty(this, "isInstancePatched", true);
                    }

                    if (typeof originalInitialize === "function") {
                        return originalInitialize.apply(this, arguments);
                    }
                };
            };

            // i set/get della initialize vengono modificati in modo da patchare al volo eventuali
            // override della proprietà da parte dei sottotipi e in modo da restituire tale 
            // proprietà patchata; per questo il metodo di extend usato 
            // deve mantenere tali getter and setter.

            // la proprietà sarà ereditata anche dai sottotipi e finirà nelle varie istanze,
            // contiene la versione patchata della initialize
            setHiddenProperty(BackboneComponent.prototype, "patchedInitialize",
                              patchInitialize(BackboneComponent.prototype.initialize));

            Object.defineProperty(BackboneComponent.prototype, "initialize", {
                configurable: true,
                enumerable: true,

                get: function() {
                    var patchedInitialize = getHiddenProperty(this, "patchedInitialize");
                    return patchedInitialize;
                },

                set: function(newInitialize) {
                    setHiddenProperty(this, "patchedInitialize", patchInitialize(newInitialize));
                }
            });
        });
    }, this);

    // @private
    var setAppComponentInfo = bind(function(appComponent, appComponentInfo) {
        var appComponentCategory = appComponentInfo.category;
        var appComponentIndex = appComponentInfo.index;

        // salva l'appComponentInfo all'interno del componente e nell'hash pubblico apposito
        setHiddenProperty(appComponent, "appComponentInfo", appComponentInfo);
        this.appComponentsInfo[appComponentCategory][appComponentIndex] = appComponentInfo;
    }, this);

    // @private
    var sendMessage = function(message) {
        message.target = "page"; // il messaggio riguarda la pagina
        window.postMessage(message, "*");
    };

    // @private
    var sendAppComponentReport = function(report) {
        // the timestamp is tipicaly used by the panel to exclude old reports
        report.timestamp = new Date().getTime();

        sendMessage({
            name: "backboneAgent:report",
            data: report
        });
    };

    // @private
    // Aggiunge il componente dell'app passato a quelli conosciuti creando l'oggetto con le info
    // e inviando un report all'esterno per informare il resto del mondo.
    // Restituisce l'indice del componente.
    var registerAppComponent = bind(function(appComponentCategory, appComponent) {
        // calcola l'indice del nuovo componente
        var appComponentIndex = ++lastAppComponentsIndex[appComponentCategory];

        var appComponentInfo = new AppComponentInfo(appComponentCategory,
                                                    appComponentIndex,
                                                    appComponent);
        setAppComponentInfo(appComponent, appComponentInfo);

        // invia un report riguardante il nuovo componente dell'app
        sendAppComponentReport({
            componentCategory: appComponentCategory,
            componentIndex: appComponentIndex,
            name: "new"
        });
        debug.log("New " + appComponentCategory, appComponent);

        return appComponentIndex;
    }, this);

    // @private
    // Si mette in ascolto sui cambiamenti della proprietà e invia un report all'esterno quando accade.
    // Nota: se la proprietà inizialmente ha già un valore diverso da undefined, viene inviato subito
    // un report.
    // recursionLevel è un intero che specifica il livello di ricorsione a cui arrivare, ad es.
    // 0 è "no ricorsione", 1 è "analizza anche le proprietà di property" e così via.
    // N.B: non specificare recursionLevel equivale a dire "ricorsione completa",
    // ma attenzione a non usarla per quegli oggetti in cui potrebbero esserci cicli o si incapperà
    // in un loop infinito.
    var monitorAppComponentProperty = bind(function(appComponent, property, recursionLevel) {
        // handler per il cambiamento della proprietà
        var propertyChanged = bind(function() {
            // invia un report riguardante il cambiamento della proprietà
            var appComponentInfo = this.getAppComponentInfo(appComponent);
            sendAppComponentReport({
                componentCategory: appComponentInfo.category,
                componentIndex: appComponentInfo.index,
                name: "change",
                componentProperty: property
            });

            //debug.log("Property " + property + " of a " + appComponentInfo.category + " has changed: ", appComponent[property]);
        }, this);

        if (appComponent[property] !== undefined) { propertyChanged(); }
        onSettedDeep(appComponent, property, propertyChanged, recursionLevel);
    }, this);

    // @private
    // Restituisce l'indice dell'azione aggiunta.
    var addAppComponentAction = bind(function(appComponent, appComponentAction) {
        var appComponentInfo = this.getAppComponentInfo(appComponent);

        appComponentInfo.actions.push(appComponentAction);
        var actionIndex = appComponentInfo.actions.length-1;

        // invia un report riguardante la nuova azione
        sendAppComponentReport({
            componentCategory: appComponentInfo.category,
            componentIndex: appComponentInfo.index,
            name: "action",
            componentActionIndex: actionIndex
        });
        //debug.log("New action: ", appComponentAction);

        return actionIndex;
    }, this);

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

                addAppComponentAction(appComponent, new AppComponentAction(
                    "Sync", actionName
                ));
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
                    // factory function found
                    patchFunction(argumentsArray, i, function(originalFunction) { return function() {
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
})();
