// Collection of AppComponentInfo for a specific category.
Modules.set('collections.AppComponentsInfo', function() {
    // imports
    var Collection = Modules.get('collections.Collection');
    var AppComponentInfo = Modules.get('models.AppComponentInfo');
    var hidden = Modules.get('hidden');

    var AppComponentsInfo = Collection.extend({

        // category of the app component info contained in this collection
        category: undefined,

        // Note: assumes models is empty.
        initialize: function(models, options) {

        },

        // Register a new app component, by creating its info model and by adding it to the collection.
        // Return the info.
        register: function(appComponent, appComponentAttributes) {
            var appComponentIndex = this.length;

            var appComponentInfo = new AppComponentInfo(appComponentAttributes, {
                category: this.category,
                index: appComponentIndex,
                component: appComponent
            });

            hidden.set(appComponent, 'appComponentInfo', appComponentInfo);
            this.add(appComponentInfo);

            return appComponentInfo;
        },

        // Return the AppComponentInfo of the given component
        getByComponent: function(appComponent) {
            return hidden.get(appComponent, 'appComponentInfo');
        }
    });

    return AppComponentsInfo;
});

Modules.set('collections.appViewsInfo', function() {
    // imports
    var AppComponentsInfo = Modules.get('collections.AppComponentsInfo');

    var appViewsInfo = new (AppComponentsInfo.extend({ // singleton
        category: 'View',

        // Return the AppComponentInfo of the view to which the given DOM element belongs, 
        // or undefined if doesn't exist.
        // An element belongs to a view if is equal to the view.el or if the view.el is the
        // closest ascendant with respect to all the other views.
        getByDOMElement: function(DOMElement) {
            // function that returns true if the 'target' DOM element is an ascendant of
            // the 'of' DOM element.
            var isAscendant = function(target, of) {
                if (!of) return false;

                var ofParent = of.parentNode;
                if (target === ofParent) return true;
                return isAscendant(target, ofParent);
            };

            // search the best candidate
            var candidateViewInfo;
            for (var i=0,l=this.length; i<l; i++) {
                var currentViewInfo = this.at(i);
                var currentView = currentViewInfo.component;

                if (currentView.el === DOMElement) {
                    // perfect candidate found
                    candidateViewInfo = currentViewInfo;
                    break;
                }
                // is currentView.el an ascendant of DOMElement and a descendant of the
                // best candidate found so far?
                var candidateView = candidateViewInfo? candidateViewInfo.component : undefined;
                var isBetterCandidate = isAscendant(currentView.el, DOMElement) &&
                                       (!candidateView || isAscendant(candidateView.el, currentView.el));
                if (isBetterCandidate) {
                    // better candidate found
                    candidateViewInfo = currentViewInfo;
                }
            }
            return candidateViewInfo;
        }

    }))();

    return appViewsInfo;
});

Modules.set('collections.appModelsInfo', function() {
    // imports
    var AppComponentsInfo = Modules.get('collections.AppComponentsInfo');

    var appModelsInfo = new (AppComponentsInfo.extend({ // singleton
        category: 'Model'
    }))();

    return appModelsInfo;
});

Modules.set('collections.appCollectionsInfo', function() {
    // imports
    var AppComponentsInfo = Modules.get('collections.AppComponentsInfo');

    var appCollectionsInfo = new (AppComponentsInfo.extend({ // singleton
        category: 'Collection'
    }))();

    return appCollectionsInfo;
});

Modules.set('collections.appRoutersInfo', function() {
    // imports
    var AppComponentsInfo = Modules.get('collections.AppComponentsInfo');

    var appRoutersInfo = new (AppComponentsInfo.extend({ // singleton
        category: 'Router'
    }))();

    return appRoutersInfo;
});


// Hash <"componentCategory", AppComponentsInfo>.
Modules.set('collections.appComponentsInfos', function() {
    // imports
    var appViewsInfo = Modules.get('collections.appViewsInfo');
    var appModelsInfo = Modules.get('collections.appModelsInfo');
    var appCollectionsInfo = Modules.get('collections.appCollectionsInfo');
    var appRoutersInfo = Modules.get('collections.appRoutersInfo');

    var AppComponentsInfos = {
        'View': appViewsInfo,
        'Model': appModelsInfo,
        'Collection': appCollectionsInfo,
        'Router': appRoutersInfo
    }

    return AppComponentsInfos;
});