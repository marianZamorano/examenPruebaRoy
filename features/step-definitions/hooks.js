const { Before } = require('@wdio/cucumber-framework')
const { browser } = require('@wdio/globals')

// La app guarda sus datos en localStorage: se limpia antes de cada escenario
// para que los escenarios sean independientes entre sí.
Before(async () => {
    await browser.url('/')
    await browser.execute(() => localStorage.clear())
})
