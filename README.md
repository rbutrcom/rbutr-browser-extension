# rbutr
rbutr destroys misinformation and promotes critical thinking online.


##  What is rbutr?
Rbutr tells you when the webpage you are viewing has been disputed, rebutted or contradicted elsewhere on the internet.

This is the rbutr's browser extension for Chrome and Firefox (WebExtensions).

To know more checkout the videos (older version of the extension): https://www.youtube.com/watch?list=PLSz7oRxf5vs39J4asj8nQFauvih7zJXl_&v=hdgNnQm9be4


## How does it work?

rbutr is a community-driven app which connects webpages together on the basis that one page argues against the other.
Visit a rebutted page and you will be told "There are rebuttals to this page." You can then open up the rebutting article(s).
Found a great rebuttal? Connect it to the page(s) it rebuts so that people reading those articles can know about it.
Want a rebuttal for a page you have found? Submit a request to the community.
Click here for more information and screenshots


## How do I build it?

**Caution!**

If you are using Windows, you need to use the Linux subsystem in order to execute the build scripts.


### 1. Install [yarn](https://yarnpkg.com/lang/en/docs/install/) and [Node.js](https://nodejs.org/en/download/package-manager/) on your machine.

### 2. Install dependencies

`$ yarn install`

### 3. Build

`$ yarn run build`


## How do I test it?

On Firefox: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Your_first_WebExtension#Trying_it_out

On Chrome & Vivaldi: https://developer.chrome.com/extensions/getstarted#unpacked

On Opera: https://dev.opera.com/extensions/testing/


## How do I enable Dev-Mode?

After you installed the extension, you might want to enable the developer mode:

1. Open the Background page on your browser's extension page (Developer Tools show up)
2. Open the "Application" section ("Storage" in Firefox)
3. Click on "Local storage" and the nested entry "chrome-extension"
4. Add a new key "rbutr-is-dev" and "true" as value

The Dev-Mode has currently 2 functionalities implemented.

1. Instead of connecting to the productive server, it connects to a Test-Server. This way you can test code changes or just play around without affecting the live data.
2. It gives you log messages in the console.


## How can I help?

Please see http://blog.rbutr.com/support-rbutr/ or have a look at the [issues](https://github.com/tomlutzenberger/rbutr-browser-extension/issues)
