// Facilities for setting and getting "hidden" properties in objects.
// (tipically used to memorize the AppComponentInfo of a given app component
//  or the data related to the patched initialize of a Backbone component)

// NOTA DI SVILUPPO: non memorizzare le proprietà nascoste in oggetti contenitori 
// in quanto sarebbero condivise da tutti i cloni / istanze e sottotipi
// (quest'ultime in caso di proprietà nascoste impostate nel prototype del tipo), 
// infatti gli oggetti sono copiati per riferimento.

Modules.set('hidden', function() {
    // imports
    var Component = Modules.get('Component');
    var u = Modules.get('utils');

    var hidden = new (Component.extend({ // singleton

        prefix: '__backboneDebugger__', // prefix to add to the hidden property names

        set: function(object, property, value) {
            if (!u.isObject(object)) return;
            Object.defineProperty(object, this.prefix+property, {
                configurable: false,
                enumerable: false,
                value: value,
                writable: true
            });
        },

        get: function(object, property) {
            if (!u.isObject(object)) return;
            return object[this.prefix+property];
        }

    }))();

    return hidden;
});
