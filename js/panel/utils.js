define(["underscore", "jquery"], function(_, $) {
    var utils = new (function() {

        this.initialize = function() {
            _.bindAll(this);
        }

        this.httpRequest = function(method, url, callback, disableCaching) {
            var requestObj = {
                type: method,
                url: url
            }
            if (disableCaching === true) {
                requestObj.cache = false;
            }

            $.ajax(requestObj).always(callback); // the callback is called also if the request fails
        }

        this.initialize();
    })();
    return utils;
});