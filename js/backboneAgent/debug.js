// backbone agent debugging facilities
Modules.set('debug', function() {

    var debug = {

        active: false, // set to true to activate backbone agent debugging mode

        log: function() {
            if (!this.active) return;
            console.log.apply(console, arguments);
        }

    };

    return debug;
});