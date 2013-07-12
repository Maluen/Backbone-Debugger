Backbone Debugger
=================

Chrome Developer Tools extension for debugging Backbone.js applications.

Features
--------
* Adds a panel under the Chrome Developer Tools that displays in real-time all your application views, models, collections and routers. Data displayed includes:
    * Views: rendering status, html element, associated model and/or collection, **handled page events**, events triggered
    * Models: last sync status, **attributes**, id, cid, url, associated collection, events triggered, **sync actions**
    * Collections: last sync status, **models**, url, events triggered, **sync actions**
    * Routers: events triggered (include **routes**)
* Extends the sidebar of the developer tools "Elements" panel to display the Backbone View of the inspected html element.

Install from source
--------
Using Google Chrome:
* [Download the project archive](https://github.com/Maluen/Backbone-Debugger/archive/master.zip) and extract it somewhere.
* Click on Tools -> Settings -> Extensions
* Select "Enable developer mode" in the upper right of the window.
* Click on "Load unpacked extension".
* Select the extracted folder.
* Enjoy!

Known Limitations
--------
Support for apps that modify the standard Backbone behavior, e.g. apps that patch core methods like extend or 
delegateEvents, or that replace part of Backbone functions with custom code, is uncertain.
However, constant efforts are taken in this direction to address the most possible use cases, so even if your application falls into this category you may still give it a try or wait for newer versions.

Development status
--------
**Version**: 0.1  
**Main activity**: stabilizing

Screenshots
--------
**Views**:

![Views](http://img827.imageshack.us/img827/7707/viewsf.jpg "Views")

**Models**:

![Models](http://img442.imageshack.us/img442/9179/models.jpg "Models")

**Collections**:

![Collections](http://img4.imageshack.us/img4/8056/collectionsq.jpg "Collections")

**Routers**:

![Routers](http://img23.imageshack.us/img23/7677/routerse.jpg "Routers")

**Elements sidebar extension**:

![Elements sidebar extension](http://img842.imageshack.us/img842/1971/elementssidebar.jpg "Elements sidebar extension")
