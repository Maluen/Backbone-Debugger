require.config({
    // paths configuration
    paths: {
        templates: '../templates',

        jquery: 'lib/jquery.min',
        underscore: 'lib/underscore-min',
        backbone: 'lib/backbone-min',
        text: 'lib/text',
        bootstrap: 'lib/bootstrap.min',
        handlebars: 'lib/handlebars'
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
        'handlebars': {
            deps: ['bootstrap'], // automatically require bootstrap when requiring an handlebars template
            exports: 'Handlebars'
        }
    }
});

require(["jquery", "Router", "backbone"], function($, Router, Backbone) {
    $(document).ready(function() {
        var router = new Router();
        Backbone.history.start();
    });
});
