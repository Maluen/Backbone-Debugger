define(["underscore", "jquery"], function(_, $) {
    var utils = new (function() {

        this.initialize = function() {

        };

        this.httpRequest = function(method, url, callback, disableCaching) {
            var requestObj = {
                type: method,
                url: url,
                dataType: 'text' // disable automatic js execution
            };
            if (disableCaching === true) {
                requestObj.cache = false;
            }

            $.ajax(requestObj)
                .done(function(data) {
                    callback(data);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    console.error('httpRequest fail', url, textStatus, errorThrown);
                })
        };

        // Call onComplete with an array containing the files data.
        // filesBasePath is an optional string that will be used as base for the urls.
        this.fetchData = function(fileURLs, filesBasePath, onComplete, disableCaching) {
            var files = [];

            var filesLoaded = 0;
            _.each(fileURLs, function(fileURL, index) {
                var fileURL = fileURL;
                if (filesBasePath) fileURL = filesBasePath+"/"+fileURL;

                this.httpRequest("get", fileURL, _.bind(function(data) {
                    files[index] = data; // replace script relative url with its content
                    filesLoaded++;

                    if (filesLoaded === fileURLs.length) {
                        // files fetch complete
                        onComplete(files);
                    }
                }, this), disableCaching);
            }, this);
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
