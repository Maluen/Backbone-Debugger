// Script caricato ogni volta che si aprono i devtools, quando si clicca per la prima volta sul pannello

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
        handlebars: '../lib/handlebars-blocks'
    },
    // libraries loaders
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
            deps: ['bootstrap'], // evita di dover includere bootstrap manualmente prima di ogni template
            exports: 'Handlebars'
        },
        'handlebars': { // handlebars con custom block helpers
            deps: ['handlebars_original'],
            exports: 'Handlebars'
        }
    }
});

require(["jquery", "routers/Router", "backbone"], function($, Router, Backbone) {
    // Non usare window.onload in quanto la pagina del panel potrebbe esser già stata caricata
    // (require è asincrono) e la callback non verrebbe mai chiamata
    $(document).ready(function() {
        var router = new Router();
        Backbone.history.start();
    });
});
