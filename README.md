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


## How do I install it?

To build the plugin you will need https://gruntjs.com/ and https://yarnpkg.com your machine.

**Caution!**

If you are using Windows, you might have to do the following steps before.
*Need to be executed with Administrator permission*

`$ yarn global install --production windows-build-tools`

`$ yarn global install node-gyp`

For details, see the full answer at [StackOverflow](http://stackoverflow.com/questions/21365714/nodejs-error-installing-with-npm)

Install dependencies

`$ yarn install`

Build with grunt

`$ grunt build`


## How do I test it?

On Firefox: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Your_first_WebExtension#Trying_it_out

On Chrome & Vivaldi: https://developer.chrome.com/extensions/getstarted#unpacked

On Opera: https://dev.opera.com/extensions/testing/


## How can I help?

Please see http://blog.rbutr.com/support-rbutr/ or have a look at the [issues](https://github.com/tomlutzenberger/rbutr-browser-extension/issues)
