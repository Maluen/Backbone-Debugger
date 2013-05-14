define(["backbone", "underscore", "panelPort", "utils"], function(Backbone, _, panelPort, utils) {
    var inspectedPageClient = new (function() {
        _.extend(this, Backbone.Events);

        this.initialize = function() {
        	_.bindAll(this);

		    // Trasforma i messaggi riguardanti la pagina ispezionata
		    // in eventi Backbone, in modo che gli utilizzatori
		    // possano usare metodi come la listenTo
		    // (che permette di rimuovere automaticamente gli handler quando non servono più)
			panelPort.onMessage.addListener(_.bind(function(message) {
				if (message && message.target == "page") {
					this.trigger(message.name, message.data);
				}
			}, this));
        }

        // Esegue la funzione func sulla pagina ispezionata
        // passandogli gli argomenti specificati nell'array args (che deve essere JSON-compatibile)
        // Utilizza la devtools.inspectedWindow.eval.
        this.execFunction = function(func, args, onExecuted, context) {
            if (context === undefined) { context = "this"; }

            var evalCode = "("+func.toString()+").apply("+context+", "+JSON.stringify(args)+");";
        	chrome.devtools.inspectedWindow.eval(evalCode, function(result, isException) {
                if (isException) {
                    throw result;
                } else {
                    onExecuted(result);
                }
            });
        }

        // Chiama la callback quando la pagina diventa pronta.
        // (se la pagina è già pronta viene chiamata subito)
        this.ready = function(onReady) {
        	this.execFunction(function() {
        		var readyState = document.readyState;
        		return (readyState != "uninitialized" && readyState != "loading");
        	}, [], _.bind(function(hasLoaded) { // on executed
        		if (hasLoaded) {
        			onReady();
        		} else {
        			this.once("ready", onReady);
        		}
        	}, this));
        }

        // Ricarica la pagina iniettando gli script specificati nell'array, i quali
        // verranno eseguiti nell'ordine in cui sono specificati.
        // injectionData è un hash opzionale a cui gli script avranno accesso tramite una variabile omonima,
        // deve essere JSON-compatibile, tipicamente è usata per passare dati non direttamente accessibili
        // agli script iniettati, come ad esempio l'url dell'estensione.
        this.reloadInjecting = function(scripts, injectionData) {
            var scriptsContents = []; // array con il contenuto dei vari script
            var scriptsLoaded = 0;

            for (var i=0,l=scripts.length; i<l; i++) {(function (i) { // ogni iterazione ha la sua closure con il suo i
                // scarica i vari script in modo asincrono (l'ordine di completamento dei download è casuale)
                utils.httpRequest("get", scripts[i], function(data) {
                    // script numero i caricato

                    // eseguendo lo script tramite eval invece che direttamente, è possibile specificare
                    // il suo url tramite il commento speciale sourceURL, 
                    // in modo da poter debuggare e distinguere i vari file iniettati.
                    scriptsContents[i] = "eval("+JSON.stringify("//@ sourceURL="+scripts[i]+"\n"+data)+");";

                    scriptsLoaded++;
                    if (scriptsLoaded == scripts.length) {
                        // script caricati

                        // unisce i vari script separandoli con un ritorno a capo
                        var toInject = scriptsContents.join('\n')+"\n"; // last "\n" prevents EOF error when injecting a single file with no newline at the end

                        // inserisce all'inizio gli injectionData
                        injectionData = (injectionData !== undefined) ? injectionData : {};
                        var injectionDataCode = "var injectionData = "+JSON.stringify(injectionData)+";\n";
                        toInject = injectionDataCode + toInject;

                        // Ricarica la pagina con gli script iniettati in cima
                        chrome.devtools.inspectedWindow.reload({
                            ignoreCache: true, // altrimenti potrebbe esser caricata la vecchia versione in cache della pagina
                            injectedScript: toInject
                        });
                    }
                }, true); // disabilita caching richieste (altrimenti se si modificano gli script iniettati verrebbero ottenute comunque le vecchie versioni)
            })(i);}
        }

        this.initialize();
    })();
    return inspectedPageClient;
});