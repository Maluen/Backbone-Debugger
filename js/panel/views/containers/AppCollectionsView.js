define(["backbone", "underscore", "jquery", "views/containers/AppComponentsView",
        "collections/appCollections" , "views/AppCollectionView"],
function(Backbone, _, $, AppComponentsView, appCollections, AppCollectionView) {
    
    var AppCollectionsView = AppComponentsView.extend({

        collection: appCollections,
        CollectionItemView: AppCollectionView,
        
    });
    return AppCollectionsView;
});
