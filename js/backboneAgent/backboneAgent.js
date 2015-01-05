Modules.set('backboneAgent', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');
    var debug = Modules.get('debug');
    var server = Modules.get('server');
    var backboneController = Modules.get('controllers.backboneController');
    var backboneComponentController = Modules.get('controllers.backboneComponentController');
    var appComponentControllers = {
        'View': Modules.get('controllers.appViewController'),
        'Model': Modules.get('controllers.appModelController'),
        'Collection': Modules.get('controllers.appCollectionController'),
        'Router': Modules.get('controllers.appRouterController')
    }
    var appComponentsInfos = Modules.get('collections.appComponentsInfos');

    var backboneAgent = new (Component.extend({ // singleton

        // business logic
        initialize: function() {

            server.start();

            // detect backbone
            backboneController.onBackboneDetected(u.bind(function(Backbone) {
                this.isBackboneDetected = true;
                debug.log('Backbone detected: ', Backbone);

                // detect backbone components
                // (the Backbone object might be only partially defined.)
                u.each(['View', 'Model', 'Collection', 'Router'], function(BackboneComponentName) {
                    u.onceDefined(Backbone, BackboneComponentName, u.bind(function(BackboneComponent) {
                        debug.log('Backbone.'+BackboneComponentName+' detected');

                        // detect backbone component instances (i.e. app components)
                        var appComponentController = appComponentControllers[BackboneComponentName];
                        backboneComponentController.onNewInstance(BackboneComponent, function(appComponent) {
                            appComponentController.handle(appComponent);
                        });
                    }, this));
                }, this);
            }, this));
        },

        // PUBLIC API

        isBackboneDetected: false,

        appComponentsInfos: appComponentsInfos,

        server: server,
        database: Modules.get('database'),
        Reader: Modules.get('Reader'),
        filters: Modules.get('filters.filters'),

        appComponentControllers: appComponentControllers

    }))();

    return backboneAgent;
});

window.__backboneAgent = Modules.get('backboneAgent');
