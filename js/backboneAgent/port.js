Modules.set('port', function() {
	// imports
	var Component = Modules.get('Component');
	var u = Modules.get('utils');

	var port = new (Component.extend({ // singleton

		isConnectedWithExtension: false,
		channel: undefined,
		extensionPortOut: undefined,
		extensionPortIn: undefined,

		initialize: function() {
			this.channel = new MessageChannel();
			this.extensionPortOut = this.channel.port1;

			this.waitForExtension();
			this.notifyStartToExtension();
		},

		waitForExtension: function() {
			window.addEventListener('message', u.bind(function(event) {
			    // Only accept messages from same frame
			    if (event.source != window) return;

			    var message = event.data;

			    // Only accept our messages
			    if (!u.isObject(message) || message.target != 'extension') return;

			    if (message.name == 'started' && !this.isConnectedWithExtension) {
			    	this.connectToExtension();
			    	this.notifyStartToExtension();
			    } else if (message.name == 'connect' && !this.extensionPortIn) {
			    	this.extensionPortIn = event.ports[0];
			    	this.listenToExtension();
			    }
			}, this));
		},

		notifyStartToExtension: function() {
			window.postMessage({
				target: 'page',
				timestamp: new Date().getTime(),
				name: 'started'
			}, '*');
		},

		connectToExtension: function() {
			window.postMessage({
				target: 'page',
				timestamp: new Date().getTime(),
				name: 'connect'
			}, [this.channel.port2], '*');

			this.isConnectedWithExtension = true;
		},

		listenToExtension: function() {
			this.extensionPortIn.addEventListener('message', u.bind(function(event) {
				var message = event.data;
				this.trigger(message.name, message);
			}, this));
			this.extensionPortIn.start();
		},

		// Note: messageName is prefixed by "backboneAgent:" and can't contain spaces
		// (because might be transformed in a Backbone event in the Panel)
		sendMessage: function(messageName, messageData) {
		    messageName = 'backboneAgent:'+messageName;

		    this.extensionPortOut.postMessage({
		        target: 'page',
		        timestamp: new Date().getTime(),
		        name: messageName,
		        data: messageData
		    });
		}

	}))();

	return port;
});