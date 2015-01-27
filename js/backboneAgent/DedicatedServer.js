// Server dedicated to a single client
Modules.set('DedicatedServer', function() {
    // imports
    var Component = Modules.get('Component');

    var DedicatedServer = Component.extend({

        // setted by the server on registration
        index: undefined,

        initialize: function(index) {
            this.index = index;
            this.readers = [];
        },

        // add the reader and return its index, which can be used to retrieve it.
        registerReader: function(reader) {
            var readerIndex = this.readers.length;
            reader.index = readerIndex;
            this.readers.push(reader);

            // re-emit the reader notifications by prepending its index in the notification name
            this.listenTo(reader, 'send', function(name, data) {
                name = 'reader:'+readerIndex+':' + name;
                this.send(name, data);
            });

            return readerIndex;
        },

        getReader: function(readerIndex) {
            return this.readers[readerIndex];
        },

        unregisterReader: function(readerIndex) {
            var reader = this.readers[readerIndex];
            if (reader) {
                this.stopListening(reader);
                reader.remove();
                delete this.readers[readerIndex];
            }
        },

        send: function(name, data) {
            this.trigger('send', name, data);
        },

        remove: function() {
            for (var i=0, l=this.readers.length; i<l; i++) {
                // note: the array might be sparse
                this.unregisterReader(i);
            }

            return this.__super.remove.apply(this, arguments);
        }

    });

    return DedicatedServer;
});