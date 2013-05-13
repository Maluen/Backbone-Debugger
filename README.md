Backbone Debugger
=================

Chrome extension for real-time debugging of JavaScript Applications made with the Backbone framework.

Features
--------
* Adds a panel under the Chrome Developer Tools that displays in real-time all your application views, models, collections and routers. Data displayed includes:
    * Views: rendering status, html element, associated model and/or collection, **handled page events**, events triggered
    * Models: sync status, **attributes**, id, cid, url, associated collection, events triggered, **sync actions**
    * Collections: sync status, **models**, url, events triggered, **sync actions**
    * Routers: events triggered (include **routes**)
* Extends the sidebar of the developer tools "Elements" panel to display the Backbone View of the inspected html element.

Install from source
--------
* [Download the project tarball](https://github.com/Maluen/Backbone-Debugger/archive/master.zip).
* Open Chrome.
* Click on Tools -> Settings -> Extensions
* Select the "Enable developer mode" checkbox in the upper right of the window.
* Click on "Load unpacked extension"
* Select the downloaded src folder.
* Enjoy!
