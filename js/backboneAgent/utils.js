//// UTILS ////

// @private
// backbone agent debugging utils
var debug = {
    active: false, // set to true in logic to activate debugging
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
    var handler = function (prop, action, newValue, oldValue) {
        if (action == "set") { callback(newValue); }
    };
    watch(object, property, handler, 0);
    return [object, property, handler];
};

// @private
// Come la onSetted, ma la callback viene chiamata solo LA PRIMA VOLTA che la proprietà è settata.
var onceSetted = function(object, property, callback) {
    var handler = function(prop, action, newValue, oldValue) {
        if (action == "set") { callback(newValue); }
    };
    watchOnce(object, property, handler, 0);
    return [object, property, handler];
};

// @private
// Monitora i set di object[property] e delle sue sottoproprietà, comprese quelle aggiunte successivamente.
// Rileva inoltre anche le cancellazioni tramite delete delle sottoproprietà.
// Il livello di profondità del watching è specificato da recursionLevel (come in watch.js):
// undefined => ricorsione completa, 0 => no ricorsione (solo il livello 0), n>0 => dal livello 0 al livello n)
var onSettedDeep = function(object, property, onChange, recursionLevel) {
    var handler = function(prop, action, change, oldValue) {
        if (action == "set" || action == "differentattr") {
            onChange();
        }
    };
    watch(object, property, handler, recursionLevel, true);
    return [object, property, handler]; // usable to stop watching via stopOnSetted
};

// @private
// watcher is an array [object, property, (internal) handler] as returned by the on setted functions
var stopOnSetted = function(watcher) {
    unwatchOne.apply(this, watcher);
};

// @private
// Watch set of properties by using timers, without adding getters/setters to the watched object and
// thus without causing possible side effects; needed when watching DOM objects properties to prevent
// the browser from stopping recognizing the changes.
var stealthOnSetted = function(object, property, callback) {
    var newValue = object[property];
    return setInterval(function() {
        var oldValue = newValue;
        newValue = object[property];
        if (newValue !== oldValue) callback(newValue);
    }, 50);
};

// @private
var stopStealthOnSetted = function(watcher) {
    clearInterval(watcher);
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

    // When calling onString on the patched function, call the originalFunction onString.
    // This is needed to allow an user of the originalFunction to manipulate its 
    // original string representation and not that of the patcher function.
    // NOTE: if the original function is undefined, use the string representation of the empty function.
    var emptyFunction = function(){};
    object[functionName].toString = function() {
        return originalFunction ? originalFunction.toString.apply(originalFunction, arguments) 
                                : emptyFunction.toString.apply(emptyFunction, arguments);
    }
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