// Script loaded every time the devtools are started, the first time the panel is opened.

require.config({
    // paths configuration
    paths: {
        templates: '../../templates',

        jquery: '../lib/jquery',
        underscore: '../lib/underscore',
        backbone: '../lib/backbone',
        text: '../lib/text',
        bootstrap: '../lib/bootstrap.min',
    },
    // non-amd library loaders
    shim: {
        'jquery': {
            exports: '$'
        },
        'underscore': {
            exports: '_'
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'backbone': {
            deps: [
                'underscore',
                'jquery',
                'bootstrap', // automatically require bootstrap when requiring an handlebars template
            ],
            init: function () {
                // exports
                return this.Backbone.noConflict();
            }
        },
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
