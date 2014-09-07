Modules.set('controllers.reportController', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');
    var backboneController = Modules.get('controllers.backboneController');
    var appComponentsInfos = Modules.get('collections.appComponentsInfos');
    var debug = Modules.get('debug');

    var reportController = new (Component.extend({ // singleton

        start: function() {
            // setup reports

            backboneController.on('backboneDetected', u.bind(function(Backbone) {
                this.sendReport('backboneDetected');
            }, this));

            u.each(appComponentsInfos, u.bind(function(appComponentsInfo) {

                // reports about new app components
                appComponentsInfo.on('add', u.bind(function(appComponent) {
                    this.sendReport(appComponentsInfo.category+':new', { 
                        componentIndex: appComponent.index
                    });
                    debug.log('New ' + appComponentsInfo.category, appComponent);
                }, this));

                // reports about new app component actions
                appComponentsInfo.on('actions:add', u.bind(function(appComponentAction) {
                    var appComponentIndex = appComponentAction.appComponentInfo.get('index');
                    this.sendReport(appComponentsInfo.category+':'+appComponentIndex+':action', {
                        componentActionIndex: appComponentAction.index
                    });
                    //debug.log('New action: ', appComponentAction);
                }, this));

                // report about app component attribute changes
                appComponentsInfo.on('change', u.bind(function(appComponentInfo) {
                    u.each(appComponentInfo.changed, function(attributeValue, attributeName) {
                        this.sendReport(appComponentsInfo.category+':'+appComponentInfo.index+':change', {
                            attribute: attributeName
                        });
                        // (we send only the attribute name for serialization and performance reasons)

                        //debug.log('Attribute ' + attributeName + ' of a ' + appComponentInfo.category + ' has changed: ', attributeValue);
                    }, this);
                }, this));

            }, this));
        },

        // Note: name is prefixed by "backboneAgent:" and can't contain spaces
        // (because it's transformed in a Backbone event in the Panel)
        sendReport: function(name, report) {
            report = report || {};
            // the timestamp is tipicaly used by the panel to exclude old reports
            report.timestamp = new Date().getTime();

            this.sendPageMessage('backboneAgent:'+name, report);
        },

        sendPageMessage: function(name, data) {
            window.postMessage({
                target: 'page',
                name: name,
                data: data
            }, '*');
        }

    }))();

    return reportController;
});
