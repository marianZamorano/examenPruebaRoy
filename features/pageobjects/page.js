const { browser } = require('@wdio/globals')

/**
* main page object containing all methods, selectors and functionality
* that is shared across all page objects
*/
module.exports = class Page {
    /**
    * Opens a sub page of the page (relative to baseUrl in wdio.conf.js)
    * @param path path of the sub page (e.g. login)
    */
    open (path = '') {
        return browser.url(`/${path}`)
    }
}
