//// DATA ////

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

// Informazioni sui componenti dell'applicazione.
// Hash <"componentCategory", [AppComponentInfo]>.
// (Gli indici degli array sono quelli dei componenti.)
this.appComponentsInfo = {
    "View": [],
    "Model": [],
    "Collection": [],
    "Router": []
};