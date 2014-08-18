Modules.set('controllers.appViewController', function() {
    // imports
    var AppComponentController = Modules.get('controllers.AppComponentController');
    var u = Modules.get('utils');
    var appViewsInfo = Modules.get('collections.appViewsInfo');
    var appModelsInfo = Modules.get('collections.appModelsInfo');
    var appCollectionsInfo = Modules.get('collections.appCollectionsInfo');

    var appViewController = new (AppComponentController.extend({ // singleton

        handle: function(view) {
            // on new instance

            var me = this;
                
            var viewInfo = appViewsInfo.register(view, {
                "component_name": null, // string
                "component_modelIndex": null, // int
                "component_collectionIndex": null, // int
                "component_status": null // can be "Created", "Rendered" or "Removed"
            });

            // based on the constructor and on the el.tagName, el.id and el.className
            var updateViewName = function() {
                var viewSelector = "";
                if (u.isObject(view.el)) {
                    if (typeof view.el.tagName == 'string' && view.el.tagName !== "") {
                        viewSelector += view.el.tagName.toLowerCase();
                    }
                    if (typeof view.el.id == 'string' && view.el.id !== "") {
                        viewSelector += "#"+view.el.id;
                    }
                    if (typeof view.el.className == 'string' && view.el.className !== "") {
                        viewSelector += "."+view.el.className.replace(/ /g, '.');
                    }
                }
                var componentName = view.constructor.name || null;
                var componentNameDetails = viewSelector || null;
                if (componentName && componentNameDetails) {
                    componentName += " - " + componentNameDetails;
                } else {
                    componentName = componentName || componentNameDetails;
                }

                viewInfo.set("component_name", componentName);
            }

            // initial attributes
            viewInfo.set("component_status", "Created");
            updateViewName(); // is based also on the constructor!

            // monitor app component properties to update attributes

            u.monitorProperty(view, "model", 0, function() {
                var componentModelInfo = appModelsInfo.getByComponent(viewInfo.component.model);
                var componentModelIndex = componentModelInfo? componentModelInfo.index : null;
                viewInfo.set("component_modelIndex", componentModelIndex);
            });

            u.monitorProperty(view, "collection", 0, function() {
                var componentCollectionInfo = appCollectionsInfo.getByComponent(viewInfo.component.collection);
                var componentCollectionIndex = componentCollectionInfo? componentCollectionInfo.index : null;
                viewInfo.set("component_collectionIndex", componentCollectionIndex);
            });

            u.monitorProperty(view, "el.tagName", 0, updateViewName, {stealth: true});
            u.monitorProperty(view, "el.id", 0, updateViewName, {stealth: true});
            u.monitorProperty(view, "el.className", 0, updateViewName, {stealth: true});

            // Patch the app component methods

            this.patchTrigger(viewInfo);
            this.patchEvents(viewInfo);

            u.patchFunctionLater(view, "delegateEvents", function(originalFunction) { return function() {
                var events = arguments[0]; // hash <selector, callback>
                if (events === undefined) {
                    // delegateEvents internally uses this.events when called without arguments,
                    // not enabling the changing of the input,
                    // hence in this case this behaviour is anticipated by using this.events as input. 
                    // (this.events can also be a function that returns the hash)
                    events = (typeof this.events == "function") ? this.events() : this.events;
                }

                // the callback in events must be patched on-the-fly
                // so to be able to track when they are called
                events = u.clone(events); // avoid to change the original object
                for (var eventType in events) {
                    if (events.hasOwnProperty(eventType)) {
                        // callback can be a function or the name of a function in the view
                        var callback = events[eventType];
                        if (typeof callback != "function") {
                            callback = this[callback];
                        }
                        if (!callback) {
                            // leave the unvalid callback untouched so that the original method
                            // can warn for the error
                            continue;
                        }

                        // callback is valid, patch it on-the-fly
                        // (every function has its own closure with the event data)
                        events[eventType] = (function(eventType, callback) {
                            return function(event) {
                                // event is the jQuery event

                                viewInfo.actions.register({
                                    "type": "Page event handling", 
                                    "name": eventType,
                                    "dataKind": "jQuery Event"
                                }, event);

                                var result = callback.apply(this, arguments);
                                return result;
                            }
                        })(eventType, callback);
                    }
                }

                // edit the arguments 
                // (it's not enough to set arguments[0] since doesn't work in strict mode)
                var argumentsArray = Array.prototype.slice.call(arguments);
                argumentsArray[0] = events;
                var result = originalFunction.apply(this, argumentsArray);

                return result;
            }});

            u.patchFunctionLater(view, "render", function(originalFunction) { return function() {
                var result = originalFunction.apply(this, arguments);

                viewInfo.set("component_status", "Rendered");

                viewInfo.actions.register({
                    "type": "Operation",
                    "name": "render"
                });

                return result;
            }});

            u.patchFunctionLater(view, "remove", function(originalFunction) { return function() {
                var result = originalFunction.apply(this, arguments);

                viewInfo.set("component_status", "Removed");

                viewInfo.actions.register({
                    "type": "Operation",
                    "name": "remove"
                });

                return result;
            }});
        }

    }))();

    return appViewController;
});