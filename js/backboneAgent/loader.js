// recupera l'url dell'estensione dai dati passati in fase di inject
var extensionUrl = injectionData["extensionUrl"];

// Configuration
var basePath = extensionUrl+"js/backboneAgent/";

var load = function(modulePath) {
    var xmlhttp = new XMLHttpRequest();
    var sourceUrl = basePath+modulePath+".js";
    xmlhttp.open("GET", sourceUrl, false); // synchronous
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.status == 200 && xmlhttp.readyState == 4) {
            eval("//@ sourceURL="+sourceUrl+"\n"+xmlhttp.responseText);
        }
    }
    xmlhttp.send();
}
// export function globally
window.__bdLoad = load;

// main
load("../lib/watch");
load("../lib/Object.observe.poly");
load("backboneAgent");

// In questo modo funziona il debug delle chiamate asincrone!!!!!!
// Se l'eval è fatto in modo sincrono, cioè mentre l'injected script è ancora in esecuzione, il debug 
// funziona bene solo per le chiamate sincrone, cioè fin tanto che l'injected script non termina, 
// una volta terminata tale esecuzione è come se i file valutati venissero cancellati/resi inaccessibili 
// dai devtools.
// In questo modo invece l'eval viene fatto dopo l'esecuzione dell'injected script, quindi probabilmente
// durante l'esecuzione dei normali script e rimane accessibile fin tanto che questi sono attivi?
// (cioè sempre)?
// Purtroppo è indispensabile che l'eval venga fatto in modo sincrono per non perdere l'avvio di Backbone.
/*
setTimeout(function() {
    debugger;
	//eval("//@ sourceURL=test.js\nsetTimeout(function() {\n    debugger;\n    alert('buh');\n}, 1000);\n");
}, 0);
*/
// Metodo alternativo, la callback dovrebbe essere chiamata più in fretta
// ma da test fatti risulta che è comunque troppo lenta...
/*
var messageName = "zero-timeout-message";
window.addEventListener("message", function() {
    if (event.source == window && event.data == messageName) {
        debugger;
        event.stopPropagation();

        eval("//@ sourceURL=test.js\nsetTimeout(function() {\n    debugger;\n    alert('buh');\n}, 1000);\n");
    }
}, true);
window.postMessage(messageName, "*");
*/