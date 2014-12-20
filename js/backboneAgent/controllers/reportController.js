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
                    this.sendReport(appComponentsInfo.category+':new', appComponent.index);
                    debug.log('New ' + appComponentsInfo.category, appComponent);
                }, this));

                // reports about new app component actions
                appComponentsInfo.on('actions:add', u.bind(function(appComponentAction) {
                    var appComponentIndex = appComponentAction.appComponentInfo.get('index');
                    this.sendReport(appComponentsInfo.category+':'+appComponentIndex+':action', 
                                    appComponentAction.index);
                    //debug.log('New action: ', appComponentAction);
                }, this));

                // report about app component attribute changes
                appComponentsInfo.on('change', u.bind(function(appComponentInfo) {
                    u.each(appComponentInfo.changed, function(attributeValue, attributeName) {
                        this.sendReport(appComponentsInfo.category+':'+appComponentInfo.index+':change', 
                                        attributeName);
                        // (we send only the attribute name for serialization and performance reasons)

                        //debug.log('Attribute ' + attributeName + ' of a ' + appComponentInfo.category + ' has changed: ', attributeValue);
                    }, this);
                }, this));

            }, this));
        },

        // Note: reportName is prefixed by "backboneAgent:" and can't contain spaces
        // (because it's transformed in a Backbone event in the Panel)
        sendReport: function(reportName /*, arg1, ... , argN */) {
            var reportArguments = Array.prototype.slice.call(arguments, 1); // from second argument
            reportName = 'backboneAgent:'+reportName;

            var report = {};
            // the timestamp is tipicaly used by the panel to exclude old reports
            report.timestamp = new Date().getTime();
            report.args = reportArguments;

            this.sendPageMessage(reportName, report);
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
