Modules.set('utils', function() {

    var utils = {

        // Return a function that calls func with the given context.
        bind: function(func, context) {
            return function() {
                return func.apply(context, arguments);
            };
        },

        isObject: function(target) {
            return typeof target == 'object' && target !== null;
        },

        isArray: function(object) {
            return Object.prototype.toString.call(object) == '[object Array]';
        },

        // Return a clone of the given object.
        // Note: the subproperties aren't cloned (shallow clone).
        clone: function(object) {
            if (!this.isObject(object)) return object;
            if (this.isArray(object)) return object.slice();

            var newObject = {};
            for (var prop in object) {
              newObject[prop] = object[prop];
            }
            return newObject;
        },

        // Extend the destination object with the properties of the source object.
        // Returns the destination object.
        extend: function(destination, source) {
            for (var prop in source) {
              destination[prop] = source[prop];
            }
            return destination;
        },

        each: function(object, iterator, context) {
            if (this.isArray(object)) {
                for (var i=0; i<object.length; i++) {
                    iterator.call(context, object[i], i, object);
                }
            } else {
                for (var prop in object) {
                    if (object.hasOwnProperty(prop)) {
                        iterator.call(context, object[prop], prop, object);
                    }
                }
            }

            // return the object for chaining
            return object;
        },

        // Note: uses WatchJS dependency.
        watchOnce: function(object, property, callback) {
            watch(object, property, function onceHandler(prop, action, newValue, oldValue) {
                // by doing the unwatch before calling the callback (instead that doing it after),
                // is possible for the callback to set the property again without ending up in an
                // infinite loop.
                unwatch(object, property, onceHandler);

                callback(prop, action, newValue, oldValue);
            });
        },

        // Call the callback every time the property of the object is setted, passing to it
        // such setted value.
        // Note: uses WatchJS dependency.
        onSetted: function(object, property, callback) {
            var handler = function (prop, action, newValue, oldValue) {
                if (action == 'set') { callback(newValue); }
            };
            watch(object, property, handler, 0);
            return [object, property, handler]; // usable to stop watching via stopOnSetted
        },

        // Like onSetted, but the callback is called only the first time the property is setted.
        onceSetted: function(object, property, callback) {
            var handler = function(prop, action, newValue, oldValue) {
                if (action == 'set') { callback(newValue); }
            };
            this.watchOnce(object, property, handler, 0);
            return [object, property, handler];  // usable to stop watching via stopOnSetted
        },

        // Monitor setting of object[property] and of its subproperties, including those added later.
        // Detects also deletions of subproperties via delete.
        // The recursion level is specified by 'recursionLevel' (like in WatchJS):
        // undefined => complete recursion, 0 => no recursion (just level 0), n>0 => from level 0 to level n)
        // Note: uses WatchJS dependency.
        onSettedDeep: function(object, property, onChange, recursionLevel) {
            var handler = function(prop, action, change, oldValue) {
                if (action == "set" || action == "differentattr") {
                    onChange();
                }
            };
            watch(object, property, handler, recursionLevel, true);
            return [object, property, handler]; // usable to stop watching via stopOnSetted
        },

        // watcher is an array [object, property, (internal) handler] as returned by the on setted functions
        // Note: uses WatchJS dependency.
        stopOnSetted: function(watcher) {
            unwatchOne.apply(this, watcher);
        },

        // Watch set of properties by using timers, without adding getters/setters to the watched object and
        // thus without causing possible side effects; needed when watching DOM objects properties to prevent
        // the browser from stopping recognizing the changes itself.
        // TODO: this creates a timer for each call, refactor to use some global timer or less expensive way.
        stealthOnSetted: function(object, property, callback) {
            var newValue = object[property];
            return setInterval(function() {
                var oldValue = newValue;
                newValue = object[property];
                if (newValue !== oldValue) callback(newValue);
            }, 50);
        },

        stopStealthOnSetted: function(watcher) {
            clearInterval(watcher);
        },

        // Like onSetted, but calls the callback every time object[property] is setted to a non
        // undefined value and also immediately if it's already non-undefined.
        onDefined: function(object, property, callback) {
            if (object[property] !== undefined) callback(object[property]);
            this.onSetted(object, property, function(newValue) {
                if (newValue !== undefined) callback(newValue);
            });
        },

        // Like onDefined, but calls the callback just once.
        // Note: uses WatchJS dependency.
        onceDefined: function(object, property, callback) {
            if (object[property] !== undefined) callback(object[property]);
            watch(object, property, function handler(prop, action, newValue, oldValue) {
                if (newValue !== undefined) {
                    unwatch(object, property, handler);

                    callback(newValue);
                }
            });
        },

        // Listen for changes to the object property and calls the callback when that happens.
        // Note: the callback is immediately called upon start if the property already has a non-undefined value.
        // - recursionLevel is an integer that specified the recursion level to reach, e.g.
        // 0 is "no recursion", 1 is "monitor also the properties of property" and so on.
        // Note: an undefined recursionLevel means "complete recursion", but keep sure to not use that
        // with objects that could contain circular references or the function will end up in an infinite loop.
        // - property may also be of the form "prop1.prop2...", stating the path to follow to reach the
        // sub-property to monitor.
        // - Possible options:
        //   - stealth: if true, uses the stealth on setted function to monitor changes; this
        //     will cause the recursionLevel to be 0 since not supported by the stealth monitoring.
        monitorProperty: function(object, property, recursionLevel, propertyChanged, options) {
            options = options || {};
            var me = this;
            var onSettedFunc = options.stealth? this.stealthOnSetted : this.onSettedDeep;
            var stopOnSettedFunc = options.stealth? this.stopStealthOnSetted : this.stopOnSetted;
            var watchers = [];

            var monitorFragment = function(object, propertyFragments, index) {
                var currentProperty = propertyFragments[index];
                var currentRecursionLevel = (index == propertyFragments.length-1) ? recursionLevel : 0; // used only in last fragment
                var onFragmentChange = function() {
                    // TODO: remove old sub setters (if any)
                    if (index == propertyFragments.length - 1) {
                        // the final target has changed
                        propertyChanged();
                    } else if (me.isObject(object[currentProperty])) {
                        // remove the watchers of the old object and of its subproperties
                        for (var i=index; i<propertyFragments.length; i++) {
                            if (watchers[i]) stopOnSettedFunc(watchers[i]);
                        }
                        // monitor the next fragment
                        monitorFragment(object[currentProperty], propertyFragments, index+1);
                    }
                }
                // watch current fragment
                watchers[index] = onSettedFunc(object, currentProperty, onFragmentChange, recursionLevel);
                if (object[currentProperty] !== undefined) { onFragmentChange(); }
            }
            monitorFragment(object, property.split('.'), 0);
        },

        // Replace the 'functionName' function property of object
        // with the one returned by the 'patcher' function.
        // The patcher function is called with the original function as argument.
        patchFunction: function(object, functionName, patcher) {
            var originalFunction = object[functionName];
            object[functionName] = patcher(originalFunction);

            // When calling onString on the patched function, call the originalFunction onString.
            // This is needed to allow an user of the originalFunction to manipulate its 
            // original string representation and not that of the patcher function.
            // NOTE: if the original function is undefined, use the string representation of the empty function.
            var emptyFunction = function() {};
            object[functionName].toString = function() {
                return originalFunction ? originalFunction.toString.apply(originalFunction, arguments) 
                                        : emptyFunction.toString.apply(emptyFunction, arguments);
            }
        },

        // Like patchFunction, but waits for the function to be defined if is undefined
        // when calling this.
        patchFunctionLater: function(object, functionName, patcher) {
            if (object[functionName] === undefined) {
                this.onceDefined(object, functionName, this.bind(function() {
                    this.patchFunction(object, functionName, patcher);
                }, this));
            } else {
                this.patchFunction(object, functionName, patcher);
            }
        },

        // String utility functions

        // Based on http://stackoverflow.com/a/498995
        trim: function(target) {
            return target.replace(/^\s+|\s+$/g, '');
        },

        // Based on http://stackoverflow.com/a/1981366
        removeMultipleSpaces: function(target) {
            return target.replace(/\s{2,}/g, ' ');
        },

        // Return the simplified version of target, i.e. a trimmed string with multiple spaces removed
        simplify: function(target) {
            return this.removeMultipleSpaces(this.trim(target));
        },

        // Based on http://stackoverflow.com/a/646643
        startsWith: function(target, str) {
            return target.slice(0, str.length) == str;
        },
        endsWith: function(target, str) {
            return target.slice(-str.length) == str;
        },

        // remove first and last char
        removeBorders: function(target) {
            target = target.substring(1); // first
            target = target.substring(0, target.length-1); // last
            return target;
        }

        // end String utility functions

    };

    return utils;
});
