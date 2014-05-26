define(["backbone", "underscore", "utils"], function(Backbone, _, utils) {

    var SearchFilter = function() { this.initialize.apply(this, arguments); };
    SearchFilter.prototype = _.extend(SearchFilter.prototype, Backbone.Events);
    SearchFilter.prototype = _.extend({

        // Search term is a space separated list of "AND" search terms, e.g. "title foo"
        initialize: function(searchTerm) {
            // save the normalized search term
            this.searchTerm = utils.string.simplify(searchTerm);
            if (utils.string.startsWith(this.searchTerm, '"') && utils.string.endsWith(this.searchTerm, '"')) {
                this.strictSearch = true;
                // remove the quotes
                this.searchTerm = utils.string.removeBorders(this.searchTerm);
            } else {
                this.strictSearch = false;
            }
            // save the list with the search terms
            this.searchTermList = this.searchTerm.split(" ");
            // case insensitive search (turns terms to lowercase)
            this.caseSensitive = false;
            this.searchTermList = _.map(this.searchTermList, function(term) { return term.toLowerCase(); });
        },

        // The method contains the actual filter logic.
        // attributeName is an optional argument with the name of the attribute in which to perform the check,
        // if omitted, the check will be performed on all the model attributes.
        // Return true if the model matches the filter.
        match: function(model, attributeName) {
            var searchTermOnObjectPropertyString = _.bind(function(property, term) {
                if (!this.caseSensitive) property = property.toLowerCase(); // case insensitive search
                if (this.strictSearch) {
                    // returns true if there exists a 'word' in the property that is equal to the search term
                    return _.some(property.split(' '), function(propertyTerm) {
                        return propertyTerm == term;
                    });
                } else {
                    // returns true if the property contains the term
                    return property.indexOf(term) != -1;
                }
            }, this);

            // returns true if the term appears in the object property (name or value)
            var searchTermOnObjectProperty = function(object, property, term) {
                // check into the property name (if it's not an array index)
                if (!_.isArray(object) && searchTermOnObjectPropertyString(String(property), term)) return true;
                // check into the property value
                var value = object[property];
                if (!_.isObject(value)) {
                    if (searchTermOnObjectPropertyString(String(value), term)) return true;
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

        // not much useful for now, the collection view handles new models manually.
        liveMatchCollection: function(collection, on, callback) {
            // start/stop live match on current collection models
            collection.each(_.bind(function(model) {
                this.liveMatch(model, on, callback);
            }, this));

            if (on) {
                this.listenTo(collection, "add", _.bind(function(model) {
                    // start live match on new model
                    this.liveMatch(model, true, callback);
                }, this));
                this.listenTo(collection, "remove", _.bind(function(model) {
                    // stop live match on old model
                    this.liveMatch(model, false, callback);
                }, this));
                this.listenTo(collection, "reset", _.bind(function(collection, options) {
                    // start live match of new models by resetting the livematch
                    _.each(options.previousModels, _.bind(function(oldModel) {
                        this.liveMatch(oldModel, false, callback);
                    }, this));
                    collection.each(_.bind(function(model) {
                        this.liveMatch(model, true, callback);
                    }, this));
                }, this));
            } else { // off
                // deactivate also collection listening
                this.stopListening(collection);
            }
        },

        // Remove the filter, i.e. do unbindings, cleanups, etc.
        remove: function() {
            this.stopListening();
        }

    }, SearchFilter.prototype);

    return SearchFilter;
});