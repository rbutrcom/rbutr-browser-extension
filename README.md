[![Releases](https://img.shields.io/github/release/rbutrcom/rbutr-browser-extension.svg)](https://github.com/rbutrcom/rbutr-browser-extension/releases)
[![NSP Status](https://nodesecurity.io/orgs/rbutrcom/projects/df6fef46-875a-4713-be11-70206dd48f3d/badge)](https://nodesecurity.io/orgs/rbutrcom/projects/df6fef46-875a-4713-be11-70206dd48f3d)
[![David](https://img.shields.io/david/rbutrcom/rbutr-browser-extension.svg)]()
[![David Dev](https://img.shields.io/david/dev/rbutrcom/rbutr-browser-extension.svg?label=devDep)]()
[![Code Climate](https://img.shields.io/codeclimate/github/rbutrcom/rbutr-browser-extension.svg)](https://codeclimate.com/github/rbutrcom/rbutr-browser-extension)
[![Documentation](https://inch-ci.org/github/rbutrcom/rbutr-browser-extension.svg?branch=master)](https://inch-ci.org/github/rbutrcom/rbutr-browser-extension)


# rbutr
rbutr destroys misinformation and promotes critical thinking online.


##  What is rbutr?
Rbutr tells you when the webpage you are viewing has been disputed, rebutted or contradicted elsewhere on the internet.

This is the rbutr's browser extension (WebExtensions).

To know more checkout the videos (older version of the extension): https://www.youtube.com/watch?list=PLSz7oRxf5vs39J4asj8nQFauvih7zJXl_&v=hdgNnQm9be4


## How does it work?

rbutr is a community-driven app which connects webpages together on the basis that one page argues against the other.
Visit a rebutted page and you will be told "There are rebuttals to this page." You can then open up the rebutting article(s).
Found a great rebuttal? Connect it to the page(s) it rebuts so that people reading those articles can know about it.
Want a rebuttal for a page you have found? Submit a request to the community.
Click here for more information and screenshots


## Which browsers are supported?

![Browser Support Chrome: supported](https://img.shields.io/badge/Chrome-supported-brightgreen.svg)
![Browser Support Firefox: supported](https://img.shields.io/badge/Firefox-supported-brightgreen.svg)
![Browser Support Opera: supported](https://img.shields.io/badge/Opera-supported-brightgreen.svg)
![Browser Support Vivaldi: supported](https://img.shields.io/badge/Vivaldi-supported-brightgreen.svg)
![Browser Support Edge: not supported](https://img.shields.io/badge/Edge-not_supported-red.svg)


## How do I build it?

**Caution!**

If you are using Windows, you need to use the Linux subsystem in order to execute the build scripts.


### 1. Install [yarn](https://yarnpkg.com/lang/en/docs/install/) and [Node.js](https://nodejs.org/en/download/package-manager/) on your machine.

### 2. Install dependencies

`$ yarn install`

### 3. Build

`$ yarn run build`

Instead of **yarn** you can also use **npm**.


## How do I test it?

**On Chrome & Vivaldi:** https://developer.chrome.com/extensions/getstarted#unpacked

**On Firefox:** https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Your_first_WebExtension#Trying_it_out

**On Opera:** https://dev.opera.com/extensions/testing/


## How do I enable Dev-Mode?

After you installed the extension, you might want to enable the developer mode:

1. Open the Background page on your browser's extension page (Developer Tools show up)
2. Open the **"Application"** section (**"Storage"** in Firefox)
3. Click on **"Local storage"** and the nested entry `chrome-extension://<extension-id>`
4. Set key `rbutr.isDev` to `true`

The Dev-Mode has currently 2 functionalities implemented.

1. Instead of connecting to the productive server, it connects to a Test-Server. This way you can test code changes or just play around without affecting the live data.
2. It gives you log messages in the console.


## How can I help?

Please see http://blog.rbutr.com/support-rbutr/ or have a look at the [issues](https://github.com/rbutrcom/rbutr-browser-extension/issues)
