define(["backbone", "underscore", "utils"], function(Backbone, _, utils) {

    var SearchFilter = function() { this.initialize.apply(this, arguments); };
    SearchFilter.prototype = _.extend(SearchFilter.prototype, Backbone.Events);
    SearchFilter.prototype = _.extend({

        // Search term is a space separated list of "AND" search terms, e.g. "title foo"
        initialize: function(searchTerm) {
            // save the normalized search term
            this.searchTerm = utils.string.simplify(searchTerm);
            // save the list with the search terms
            this.searchTermList = this.searchTerm.split(" ");
        },

        // The method contains the actual filter logic.
        // attributeName is an optional argument with the name of the attribute in which to perform the check,
        // if omitted, the check will be performed on all the model attributes.
        // Return true if the model matches the filter.
        match: function(model, attributeName) {
            /****************************************
            TODO:
            - Passare l'attributeName dal liveMatch (here in liveMatch)
            - Aggiungere supporto al templating per i dettagli sulla search (AppComponentsView)
            - Modificare indexOf per cercare solo in parole (here)
            - Trasformare le property/value in stringhe cercabili, es. "component_status" => "Status" (da vedere)
            - Fixare la openAll/closeAll che ora come ora apre/chiude anche i componenti nascosti
            - Controllare cosa succede cliccando l'openAll/closeAll durante la fase di filtering e viceversa
              (con molti componenti, defer attive, etc.)
            - Permettere l'inspect di elementi non presenti causa ricerca => li visualizzo cercando
              "component_index [index]"
                - Cosa succede se ci sono molti componenti e la ricerca richiede diversi secondi? Bisogna
                  aspettare che il rendering finisca prima di selezionare il componente.
            **************************/

            // returns true if the term appears in the object property (name or value)
            var searchTermOnObjectProperty = function(object, property, term) {
                // check into the property name (if it's not an array index)
                if (!_.isArray(object) && String(property).indexOf(term) != -1) return true;
                // check into the property value
                var value = object[property];
                if (!_.isObject(value)) {
                    if (String(value).indexOf(term) != -1) return true;
                } else {
                    // recursive check
                    if (searchOnObject(value, [term])) return true;
                }
                return false;
            }

            // returns true if each term appears in the object property (name or value)
            var searchOnObjectProperty = function(object, property, terms) {
                for (var i=0; i<terms.length; i++) {
                    if (!searchTermOnObjectProperty(object, property, terms[i])) return false;
                }
                return true;
            }

            // returns true if each term appears in at least one object property (name or value)
            // objects can be an actual object or an array.
            var searchOnObject = function(object, terms) {
                if (_.isArray(object)) {
                    for (var i=0; i<object.length; i++)
                        if (searchOnObjectProperty(object, i, terms)) return true;
                } else {
                    for (property in object)
                        if (object.hasOwnProperty(property))
                            if (searchOnObjectProperty(object, property, terms)) return true;
                }
                return false;
            }

            if (attributeName !== undefined) {
                return searchOnObjectProperty(model.attributes, attributeName, this.searchTermList);
            }
            return searchOnObject(model.attributes, this.searchTermList);

            // STUB
            //return Math.floor((Math.random()*2)+1)-1; // random number between 0 and 1 => random true/false
        },

        // If on is true, listen to the model change events in order to recheck the filter,
        // calling callback with the info if the result changes. Also immediately calls the callback 
        // with the initial result.
        // If on is false, deactivate the live check.
        liveMatch: function(model, on, callback) {
            if (on) {
                // activate
                var result = this.match(model);
                this.listenTo(model, "change", _.bind(function() {
                    var newResult = this.match(model);
                    if (newResult != result) {
                        result = newResult;
                        callback(model, newResult);
                    }
                }, this));
                callback(model, result);
            } else {
                // deactivate
                this.stopListening(model);
            }
        },

        // Remove the filter, i.e. do unbindings, cleanups, etc.
        remove: function() {
            this.stopListening();
        }

    }, SearchFilter.prototype);

    return SearchFilter;
});