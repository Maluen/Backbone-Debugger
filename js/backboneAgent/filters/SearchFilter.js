Modules.set('filters.SearchFilter', function() {
    // imports
    var Filter = Modules.get('filters.Filter');
    var u = Modules.get('utils');

    var SearchFilter = Filter.extend({

        initialize: function() {
            this.__super.initialize.apply(this, arguments);

            this.searchTerm = this.options.searchTerm || "";
            this.caseSensitive = this.options.caseSensitive || false;

            // normalize the search term
            this.searchTerm = u.simplify(this.searchTerm);
            if (u.startsWith(this.searchTerm, '"') && u.endsWith(this.searchTerm, '"')) {
                this.strictSearch = true;
                // remove quotes
                this.searchTerm = u.removeBorders(this.searchTerm);
            } else {
                this.strictSearch = false;
            }

            // extract search terms
            this.searchTermList = this.searchTerm.split(" ");

            if (!this.caseSensitive) {
                // case insensitive search (turns terms to uppercase)
                for (var i=0, l=this.searchTermList.length; i<l; i++) {
                    this.searchTermList[i] = this.searchTermList[i].toUpperCase();
                }
            }
        },

        // The method contains the actual filter logic.
        // attributeName is an optional argument with the name of the attribute in which to perform the check,
        // if omitted, the check will be performed on all the model attributes.
        // Return true if the model matches the filter.
        match: function(model, attributeName) {
            if (attributeName !== undefined) {
                return this.searchOnObjectProperty(model.attributes, attributeName, this.searchTermList);
            }
            return this.searchOnObject(model.attributes, this.searchTermList);
        },

        // return true if each term appears in at least one object property (name or value)
        // object can be an actual object or an array.
        searchOnObject: function(object, terms) {
            if (u.isArray(object)) {
                for (var i=0, l=object.length; i<l; i++)
                    if (this.searchOnObjectProperty(object, i, terms)) return true;
            } else {
                for (var property in object) {
                    if (object.hasOwnProperty(property)) {
                        if (this.searchOnObjectProperty(object, property, terms)) return true;
                    }
                }
            }
            return false;
        },

        // return true if each term appears in the object property (name or value)
        searchOnObjectProperty: function(object, property, terms) {
            for (var i=0, l=terms.length; i<l; i++) {
                if (!this.searchTermOnObjectProperty(object, property, terms[i])) return false;
            }
            return true;
        },

        // return true if the term appears in the object property (name or value)
        searchTermOnObjectProperty: function(object, property, term) {
            // check into the property name (if it's not an array index)
            if (!u.isArray(object) && this.searchTermOnObjectPropertyString(String(property), term)) return true;
            // check into the property value
            var value = object[property];
            if (!u.isObject(value)) {
                if (this.searchTermOnObjectPropertyString(String(value), term)) return true;
            } else {
                // recursive check
                if (this.searchOnObject(value, [term])) return true;
            }
            return false;
        },

        searchTermOnObjectPropertyString: function(property, term) {
            if (!this.caseSensitive) property = property.toUpperCase(); // case insensitive search
            if (this.strictSearch) {
                // returns true if there exists a 'word' in the property that is equal to the search term
                var words = property.split(' ');
                for (var i=0, l=words.length; i<l; i++) {
                    if (words[i] == term) return true;
                }
            } else {
                // returns true if the property contains the term
                return property.indexOf(term) != -1;
            }
        }

    });

    return SearchFilter;
});