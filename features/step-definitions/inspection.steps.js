const { When, Then } = require('@wdio/cucumber-framework')
const { browser, expect } = require('@wdio/globals')

const { readBrowserStorage, logToConsole, attachJson } = require('../support/inspector')

const SESSION_KEY = 'hotel-qa:session'
const DB_KEY = 'hotel-qa:db'

// Revisa lo mismo que DevTools > Application: localStorage, sessionStorage,
// cookies, Cache Storage, Service Workers e IndexedDB. Se adjunta a Allure.
When('inspecciono el almacenamiento del navegador', async function () {
    this.storage = await readBrowserStorage()
    await attachJson('Almacenamiento del navegador', this.storage)
    await logToConsole(`localStorage.getItem('${SESSION_KEY}')`, this.storage.localStorage[SESSION_KEY] ?? null)
    await logToConsole('Object.keys(localStorage)', Object.keys(this.storage.localStorage))
})

When('establezco la sesión {string} en el almacenamiento del navegador', async (userId) => {
    await browser.execute((key, id) => localStorage.setItem(key, id), SESSION_KEY, userId)
    await logToConsole(`localStorage.setItem('${SESSION_KEY}', '${userId}')`, `sesión establecida sin iniciar sesión: ${userId}`)
})

Then('la sesión no debería existir en el almacenamiento del navegador', function () {
    expect(this.storage.localStorage[SESSION_KEY]).toBeUndefined()
})

Then('el usuario {string} debería figurar como {string} en el almacenamiento', async (username, status) => {
    const user = await browser.execute((key, name) => JSON.parse(localStorage.getItem(key)).users.find((u) => u.username === name), DB_KEY, username)
    await logToConsole(`usuario "${username}" en localStorage['${DB_KEY}']`, { username: user.username, status: user.status })
    expect(user.status).toBe(status)
})

Then('el almacenamiento del navegador no debería contener la contraseña {string}', async (password) => {
    const users = await browser.execute((key) => JSON.parse(localStorage.getItem(key)).users
        .map(({ username, password, role, status }) => ({ username, password, role, status })), DB_KEY)
    await logToConsole(`JSON.parse(localStorage.getItem('${DB_KEY}')).users`, users)
    await attachJson('Usuarios guardados en localStorage', users)
    const storage = await readBrowserStorage()
    expect(JSON.stringify(storage)).not.toContain(password)
})

Then('la sesión almacenada debería tener una fecha de expiración', function () {
    const raw = this.storage.localStorage[SESSION_KEY]
    let session
    try { session = JSON.parse(raw) } catch { session = raw }
    const hasExpiration = typeof session === 'object' && session !== null &&
        Object.keys(session).some((key) => /exp/i.test(key))
    expect(hasExpiration).toBe(true)
})

Then('la aplicación no debería usar Service Workers, Cache Storage ni cookies', function () {
    expect(this.storage.serviceWorkers).toBe(0)
    expect(this.storage.cacheStorage).toEqual([])
    expect(this.storage.cookies).toBe('')
})

// Equivale a revisar el header Cache-Control en DevTools > Network
Then('el documento no debería guardarse en la caché HTTP', async () => {
    const cacheControl = await browser.execute(async () =>
        (await fetch(location.href, { cache: 'no-store' })).headers.get('cache-control'))
    await attachJson('Header Cache-Control', { 'cache-control': cacheControl })
    await logToConsole("fetch(location.href) → headers.get('cache-control')", cacheControl)
    expect(cacheControl).toContain('max-age=0')
})

Then('no debería ejecutarse el código inyectado', async () => {
    const executed = await browser.execute(() => window.__xss === 1)
    expect(executed).toBe(false)
})
