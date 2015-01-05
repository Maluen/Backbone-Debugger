// Hash <"filter name", Filter>.
Modules.set('filters.filters', function() {
    // imports
    var SearchFilter = Modules.get('filters.SearchFilter');

    var filters = {
        'search': SearchFilter
    }

    return filters;
});