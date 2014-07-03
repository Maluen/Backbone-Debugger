// Script loaded every time the devtools are started, the first time the panel is opened.

require.config({
    // paths configuration
    paths: {
        templates: '../../templates',

        jquery: '../lib/jquery',
        underscore: '../lib/underscore-min',
        backbone: '../lib/backbone',
        text: '../lib/text',
        bootstrap: '../lib/bootstrap.min',
        handlebars_original: '../lib/handlebars',
        handlebars: '../lib/handlebars-blocks',
        setImmediate: '../lib/setImmediate'
    },
    // non-amd library loaders
    shim: {
        'jquery': {
            exports: '$'
        },
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            init: function () {
                // exports
                return this.Backbone.noConflict();
            }
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'handlebars_original': {
            deps: ['bootstrap'], // automatically require bootstrap when requiring an handlebars template
            exports: 'Handlebars'
        },
        'handlebars': { // handlebars with custom block helpers
            deps: ['handlebars_original'],
            exports: 'Handlebars'
        },
        'setImmediate': {
            exports: 'setImmediate'
        }
    }
});

require(["jquery", "routers/Router", "backbone"], function($, Router, Backbone) {
    // Don't use window.onload because the panel page may be already ready
    // (require is asynchronous) and the callback would never be called, while the jQuery version
    // calls it immediately in that situation.
    $(document).ready(function() {
        var router = new Router();
        Backbone.history.start();
    });
});
