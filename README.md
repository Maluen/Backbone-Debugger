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
However, constant efforts are taken in this direction to address the most possible use cases, so even if your application falls into this category you may still give it a try, [open an issue](https://github.com/Maluen/Backbone-Debugger/issues) or wait for newer versions.

Screenshots
--------
**Views**:

![Views](http://img706.imageshack.us/img706/5843/8tsw.png "Views")

**Models**:

![Models](http://imageshack.us/a/img856/4706/e4jw.png "Models")

**Collections**:

![Collections](http://img199.imageshack.us/img199/1153/ctva.png "Collections")

**Routers**:

![Routers](http://img23.imageshack.us/img23/7677/routerse.jpg "Routers")

**Elements sidebar extension**:

![Elements sidebar extension](http://img716.imageshack.us/img716/2227/dzun.png "Elements sidebar extension")
