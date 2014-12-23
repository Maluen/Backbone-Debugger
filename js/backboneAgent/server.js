Modules.set('server', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');
    var DedicatedServer = Modules.get('DedicatedServer');
    var backboneController = Modules.get('controllers.backboneController');
    var appComponentsInfos = Modules.get('collections.appComponentsInfos');
    var debug = Modules.get('debug');

    var server = new (Component.extend({ // singleton

        initialize: function() {
            this.dedicatedServers = []; // this might be sparse!
        },

        
        start: function() {
            // setup incoming messages listening and handling

            window.addEventListener('message', u.bind(function(event) {
                // Only accept messages from same frame
                if (event.source != window) return;

                var message = event.data;

                // Only accept our messages
                if (typeof message != 'object' || message === null || message.target != 'extension') return;

                this.trigger(message.name, message);
            }, this));

            this.listenTo(this, 'client:connect', function() {
                var clientIndex = this.connect();
                this.sendMessage('connected', {clientIndex: clientIndex});
            });

            this.listenTo(this, 'client:disconnect', function(message) {
                // disconnect client
                var details = message.data;
                this.disconnect(details.clientIndex);
            });

            // setup outgoing messages
            // OBSOLETE

            this.listenTo(backboneController, 'backboneDetected', function(Backbone) {
                this.sendMessage('backboneDetected');
            });

            u.each(appComponentsInfos, u.bind(function(appComponentsInfo) {

                // messages about new app components
                this.listenTo(appComponentsInfo, 'add', function(appComponent) {
                    this.sendMessage(appComponentsInfo.category+':new', { 
                        componentIndex: appComponent.index
                    });
                    debug.log('New ' + appComponentsInfo.category, appComponent);
                });

                // messages about new app component actions
                this.listenTo(appComponentsInfo, 'actions:add', function(appComponentAction) {
                    var appComponentIndex = appComponentAction.appComponentInfo.get('index');
                    this.sendMessage(appComponentsInfo.category+':'+appComponentIndex+':action', {
                        componentActionIndex: appComponentAction.index
                    });
                    //debug.log('New action: ', appComponentAction);
                });

                // messages about app component attribute changes
                this.listenTo(appComponentsInfo, 'change', function(appComponentInfo) {
                    u.each(appComponentInfo.changed, function(attributeValue, attributeName) {
                        this.sendMessage(appComponentsInfo.category+':'+appComponentInfo.index+':change', {
                            attributeName: attributeName
                        });
                        // (we send only the attribute name for serialization and performance reasons)

                        //debug.log('Attribute ' + attributeName + ' of a ' + appComponentInfo.category + ' has changed: ', attributeValue);
                    }, this);
                });

            }, this));
        },

        // return the client / dedicated server index
        connect: function() {
            var index = this.dedicatedServers.length;
            var dedicatedServer = new DedicatedServer(index);
            this.dedicatedServers.push(dedicatedServer);

            // transform the dedicated server notifications into outgoing messages
            this.listenTo(dedicatedServer, 'notify', function(notifyName, notifyData) {
                notifyName = 'dedicatedServer:'+index+':' + notifyName;
                this.sendMessage(notifyName, notifyData);
            });

            return index;
        },

        getDedicatedServer: function(index) {
            return this.dedicatedServers[index];
        },

        disconnect: function(index) {
            var dedicatedServer = this.dedicatedServers[index];
            if (dedicatedServer) {
                dedicatedServer.stopListening();
                dedicatedServer.remove();
                delete this.dedicatedServers[index];
            }
        },

        // Note: messageName is prefixed by "backboneAgent:" and can't contain spaces
        // (because it's transformed in a Backbone event in the Panel)
        sendMessage: function(messageName, messageData) {
            messageName = 'backboneAgent:'+messageName;

            window.postMessage({
                target: 'page',
                timestamp: new Date().getTime(),
                name: messageName,
                data: messageData
            }, '*');
        }

    }))();

    return server;
});