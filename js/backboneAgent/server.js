Modules.set('server', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');
    var port = Modules.get('port');
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

            this.listenTo(port, 'client:connect', function() {
                var clientIndex = this.connect();
                port.sendMessage('connected', {clientIndex: clientIndex});
            });

            this.listenTo(port, 'client:disconnect', function(message) {
                // disconnect client
                var details = message.data;
                this.disconnect(details.clientIndex);
            });

            // setup outgoing messages

            this.listenTo(backboneController, 'backboneDetected', function(Backbone) {
                port.sendMessage('backboneDetected');
            });

            u.each(appComponentsInfos, u.bind(function(appComponentsInfo) {

                // messages about app component attribute changes
                this.listenTo(appComponentsInfo, 'change', function(appComponentInfo) {
                    u.each(appComponentInfo.changed, function(attributeValue, attributeName) {
                        port.sendMessage(appComponentsInfo.category+':'+appComponentInfo.index+':change', {
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
            this.listenTo(dedicatedServer, 'send', function(name, data) {
                name = 'dedicatedServer:'+index+':' + name;
                port.sendMessage(name, data);
            });

            return index;
        },

        getDedicatedServer: function(index) {
            return this.dedicatedServers[index];
        },

        disconnect: function(index) {
            var dedicatedServer = this.dedicatedServers[index];
            if (dedicatedServer) {
                this.stopListening(dedicatedServer);
                dedicatedServer.remove();
                delete this.dedicatedServers[index];
            }
        }

    }))();

    return server;
});