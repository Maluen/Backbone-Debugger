//// DATA ////

// @private
var AppComponentInfo = function(category, index, component, attributes, actions) {

    // nome del componente Backbone di cui questo componente dell'app è un discendente.
    // I valori validi sono "View", "Model", "Collection", "Router"
    this.category = category;
    // usato come identificatore tra tutti i componenti dell'app della sua categoria
    this.index = index;

    this.component = component; // the Backbone appComponent object (e.g. the view instance)

    // attributes of the component, must be json-compatible since is what is passed to the client.
    // depend on the component type, except the following defaults
    this.attributes = extend({
        "index": this.index // int
    }, attributes||{});

    this.actions = actions || []; // array of AppComponentAction objects
};

// @private
// Action of an app component.
var AppComponentAction = function(appComponentInfo, index, attributes, data) {

    // the AppComponentInfo object of the component this action belongs to
    this.appComponentInfo = appComponentInfo;
    // the index of the action relative to those of the appComponent
    this.index = index;

    this.attributes = extend({ // defaults
        "index": this.index,
        "timestamp": new Date().getTime(), // milliseconds
        "type": null, // string
        "name": null, // string
        // mandatory if data is defined, can be
        // - "jQuery Event": if data is a jQuery Event object
        // - "event arguments": if data is an array with the arguments of a Backbone event
        "dataKind": null
    }, attributes||{});

    this.data = data;
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

// Informazioni sui componenti dell'applicazione.
// Hash <"componentCategory", [AppComponentInfo]>.
// (Gli indici degli array sono quelli dei componenti.)
this.appComponentsInfo = {
    "View": [],
    "Model": [],
    "Collection": [],
    "Router": []
};