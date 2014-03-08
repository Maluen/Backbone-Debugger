define(["underscore", "jquery"], function(_, $) {
    var utils = new (function() {

        this.initialize = function() {
            _.bindAll(this);
        };

        this.httpRequest = function(method, url, callback, disableCaching) {
            var requestObj = {
                type: method,
                url: url
            };
            if (disableCaching === true) {
                requestObj.cache = false;
            }

            $.ajax(requestObj).always(callback); // the callback is called also if the request fails
        };

        // String utility functions.
        this.string = {

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
        }

        this.initialize();
    })();
    return utils;
});
