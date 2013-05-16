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
