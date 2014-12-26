
Modules.set('database', function() {
    // imports
    var Component = Modules.get('Component');
    var appComponentsInfos = Modules.get('collections.appComponentsInfos');

    var database = new (Component.extend({ // singleton

        // url structure:
        // /[appComponentsName]/[appComponentIndex]/actions/[actionIndex]
        // where appComponentsName must be 'views', 'models', 'collections' or 'routers'

        // TODO: refactor to make components collections directly use this as categories?
        // hash <appComponentsName, appComponentsInfo category>
        appComponentsNameMappings: {
            'views': 'View',
            'models': 'Model',
            'collections': 'Collection',
            'routers': 'Router'
        },

        getAppComponentsInfo: function(appComponentsName) {
            var appComponentsCategory = this.appComponentsNameMappings[appComponentsName];
            return appComponentsInfos[appComponentsCategory];
        },

        getAppComponentInfo: function(appComponentsInfo, appComponentIndex) {
            return appComponentsInfo.at(appComponentIndex);
        },

        getAppComponentActions: function(appComponentInfo) {
            return appComponentInfo.actions;
        },

        getAppComponentAction: function(appComponentActions, actionIndex) {
            return appComponentActions.at(actionIndex);
        },

        // TODO: is a quick solution limited in scope, but works.
        get: function(url) {
            var urlParts = url.split('/');

            // (starts from 1 since first part is empty)

            var appComponentsName = urlParts[1];
            var appComponentsInfo = this.getAppComponentsInfo(appComponentsName);
            if (typeof urlParts[2] == 'undefined') return appComponentsInfo;

            var appComponentIndex = urlParts[2];
            var appComponentInfo = this.getAppComponentInfo(appComponentsInfo, appComponentIndex);
            if (typeof urlParts[3] == 'undefined') return appComponentInfo;

            // urlParts[2] is fixed to 'actions'
            if (urlParts[3] != 'actions') throw 'Invalid url';
            var appComponentActions = this.getAppComponentActions(appComponentInfo);
            if (typeof urlParts[4] == 'undefined') return appComponentActions;

            var actionIndex = urlParts[4];
            var appComponentAction = this.getAppComponentAction(appComponentActions, actionIndex);
            return appComponentAction;
        }

    }))();

    return database;
});