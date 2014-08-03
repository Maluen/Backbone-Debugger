//// BASE ////

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
    Object.defineProperty(object, hiddenPropertyPrefix+property, {
        configurable: false,
        enumerable: false,
        value: value,
        writable: true
    });
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
// Note: name is prefixed by "backboneAgent:" and can't contain spaces
//       (because it's transformed in a Backbone event in the Panel)
var sendAppComponentReport = function(name, report) {
    // the timestamp is tipicaly used by the panel to exclude old reports
    report.timestamp = new Date().getTime();

    sendMessage({
        name: "backboneAgent:"+name,
        data: report
    });
};

// @private
// Return the info of the new registered app component.
var registerAppComponent = bind(function(appComponentCategory, appComponent, appComponentAttributes) {
    // calcola l'indice del nuovo componente
    var appComponentIndex = ++lastAppComponentsIndex[appComponentCategory];

    var appComponentInfo = new AppComponentInfo(appComponentCategory,
                                                appComponentIndex,
                                                appComponent,
                                                appComponentAttributes);
    setAppComponentInfo(appComponent, appComponentInfo);

    // send a report about the new app component
    sendAppComponentReport(appComponentCategory+":new", { componentIndex: appComponentIndex });
    debug.log("New " + appComponentCategory, appComponent);

    return appComponentInfo;
}, this);

// @private
// Return the new added action.
var addAppComponentAction = bind(function(appComponentInfo, appComponentActionAttributes, appComponentActionData) {

    var actionIndex = appComponentInfo.actions.length;

    var appComponentAction = new AppComponentAction(appComponentInfo,
                                                    actionIndex,
                                                    appComponentActionAttributes,
                                                    appComponentActionData);
    appComponentInfo.actions.push(appComponentAction);

    // send a report about the new action
    sendAppComponentReport(appComponentInfo.category+":"+appComponentInfo.index+":action", {
        componentActionIndex: actionIndex
    });
    //debug.log("New action: ", appComponentAction);

    return appComponentAction;
}, this);

// @private
// Si mette in ascolto sui cambiamenti della proprietà e chiama la callback quando accade.
// Note: the callback is immediately called upon start if the property already has a non-undefined value.
// recursionLevel è un intero che specifica il livello di ricorsione a cui arrivare, ad es.
// 0 è "no ricorsione", 1 è "analizza anche le proprietà di property" e così via.
// N.B: non specificare recursionLevel equivale a dire "ricorsione completa",
// ma attenzione a non usarla per quegli oggetti in cui potrebbero esserci cicli o si incapperà
// in un loop infinito.
// property may also be of the form "prop1.prop2...", stating the path to follow to reach the
// sub-property to monitor.
// Possible options:
// - stealth: if true then uses the stealth on setted function to monitor for changes, but this
//   will cause the recursionLevel to be 0 since is not supported by the stealth monitoring.
var monitorAppComponentProperty = bind(function(appComponent, property, recursionLevel, propertyChanged, options) {
    options = options || {};
    var onSettedFunc = options.stealth? stealthOnSetted : onSettedDeep;
    var stopOnSettedFunc = options.stealth? stopStealthOnSetted : stopOnSetted;
    var watchers = [];

    var monitorFragment = function(object, propertyFragments, index) {
        var currentProperty = propertyFragments[index];
        var currentRecursionLevel = (index == propertyFragments.length-1) ? recursionLevel : 0; // used only in last fragment
        var onFragmentChange = function() {
            // TODO: remove old sub setters (if any)
            if (index == propertyFragments.length - 1) {
                // the final target has changed
                propertyChanged();
            } else if (isObject(object[currentProperty])) {
                // remove the watchers of the old object and of its subproperties
                for (var i=index; i<propertyFragments.length; i++) {
                    if (watchers[i]) stopOnSettedFunc(watchers[i]);
                }
                // monitor the next fragment
                monitorFragment(object[currentProperty], propertyFragments, index+1);
            }
        }
        // watch current fragment
        watchers[index] = onSettedFunc(object, currentProperty, onFragmentChange, recursionLevel);
        if (object[currentProperty] !== undefined) { onFragmentChange(); }
    }
    monitorFragment(appComponent, property.split('.'), 0);
}, this);

// @private
// Change the component attribute and send a report stating that it changed.
var setAppComponentAttribute = function(appComponentInfo, attributeName, attributeValue) {
    appComponentInfo.attributes[attributeName] = attributeValue;
    
    sendAppComponentReport(appComponentInfo.category+":"+appComponentInfo.index+":change", {
        attribute: attributeName
    });
    // (we send only the attribute name for serialization and performance reasons)

    //debug.log("Attribute " + attributeName + " of a " + appComponentInfo.category + " has changed: ", attributeValue);
};