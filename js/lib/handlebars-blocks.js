Handlebars.registerHelper('unlessNull', function(conditionals, options) {
    if (conditionals !== null) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('unlessIsObject', function(conditionals, options) {
    if (typeof conditionals != "object" || conditionals === null) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

// {{#compare unicorns ponies operator="<"}}
//  I knew it, unicorns are just low-quality ponies!
// {{/compare}}
// 
// (defaults to == if operator omitted)
//
// {{#compare unicorns ponies }}
//  That's amazing, unicorns are actually undercover ponies
// {{/compare}}
// (from http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/)
Handlebars.registerHelper('compare', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

    operator = options.hash.operator || "==";

    var operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    };
    if (!operators[operator])
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+operator);

    var result = operators[operator](lvalue, rvalue);
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

// Block for iterating over an hash.
// key: {{key}}, value: {{value}}
// Based on http://stackoverflow.com/a/9058854/1418049
Handlebars.registerHelper('hash', function(context, options) {
    var ret = "";
    for(var prop in context) {
        if (context.hasOwnProperty(prop)) {
            ret += options.fn({key:prop, value:context[prop]});
        }
    }
    return ret;
});

// Stringify context exporting it as {{value}}
Handlebars.registerHelper('stringify', function(context, options) {
    return options.fn({value: JSON.stringify(context)});
});

// exports as {{type}} (e.g. "[object Array]")
Handlebars.registerHelper('getObjectType', function(context, options) {
    var type = Object.prototype.toString.call(context);
    return options.fn({type: type});
});
