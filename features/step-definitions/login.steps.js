const { Given, When, Then } = require('@wdio/cucumber-framework')
const { browser, expect } = require('@wdio/globals')

const LoginPage = require('../pageobjects/login.page')
const Header = require('../pageobjects/components/header')
const Footer = require('../pageobjects/components/footer')
const { logToConsole, attachJson, collectDiagnostics } = require('../support/inspector')

Given('que estoy en la página de login', async () => {
    await LoginPage.open()
})

// Precondición reutilizable en otros features (incisos 2 y 4)
Given('que inicié sesión con usuario {string} y contraseña {string}', async (username, password) => {
    await LoginPage.open()
    await LoginPage.login(username, password)
    await expect(browser).toHaveUrl(expect.stringContaining('/habitaciones'))
})

// La app no tiene pantalla para bloquear usuarios: se simula el bloqueo
// cambiando el estado del usuario en la "base de datos" (localStorage)
Given('el usuario {string} es bloqueado por recepción', async (username) => {
    await browser.execute((user) => {
        const db = JSON.parse(localStorage.getItem('hotel-qa:db'))
        db.users.find((u) => u.username === user).status = 'bloqueado'
        localStorage.setItem('hotel-qa:db', JSON.stringify(db))
    }, username)
})

When('inicio sesión con usuario {string} y contraseña {string}', async (username, password) => {
    await LoginPage.login(username, password)
})

When('inicio sesión con usuario {string} y contraseña {string} presionando Enter', async (username, password) => {
    await LoginPage.loginWithEnter(username, password)
})

When('inicio sesión {int} veces con usuario {string} y una contraseña incorrecta', async (attempts, username) => {
    for (let i = 1; i <= attempts; i++) {
        await LoginPage.login(username, `incorrecta${i}`)
        await expect(LoginPage.errorMessage).toBeDisplayed()
        await logToConsole(`Intento ${i} con contraseña incorrecta`, await LoginPage.errorMessage.getText())
    }
})

When('inicio sesión con un usuario y una contraseña de {int} caracteres', async (length) => {
    await LoginPage.login('a'.repeat(length), 'b'.repeat(length))
})

When('escribo {string} en el campo usuario', async (text) => {
    await LoginPage.inputUsername.setValue(text)
})

When('hago clic en {string} del pie de página', async (option) => {
    if (option !== 'Restablecer datos') throw new Error(`Opción no soportada: ${option}`)
    await Footer.resetData()
})

When('navego a la ruta {string}', async (path) => {
    await browser.url(path)
})

When('recargo la página', async () => {
    await browser.refresh()
})

When('cierro sesión', async () => {
    await Header.logout()
    // Esperar a que el logout termine antes de seguir (evita condiciones de carrera)
    await expect(LoginPage.btnSubmit).toBeDisplayed()
})

When('vuelvo a la página anterior del navegador', async () => {
    await browser.back()
})

// Se guarda el identificador de cada pestaña al abrirla: con DevTools abierto el
// navegador también expone sus ventanas, así que no basta con el orden.
When('abro la aplicación en una nueva pestaña', async function () {
    const firstTab = await browser.getWindowHandle()
    const before = await browser.getWindowHandles()
    await browser.newWindow(`${browser.options.baseUrl}/habitaciones`, { type: 'tab' })
    // La pestaña nueva es la ventana que apareció y que muestra la aplicación
    // (con DevTools abierto también aparece la ventana de DevTools de esa pestaña)
    const opened = (await browser.getWindowHandles()).filter((handle) => !before.includes(handle))
    for (const handle of opened) {
        await browser.switchToWindow(handle)
        if ((await browser.getUrl()).startsWith(browser.options.baseUrl)) break
    }
    await expect(Header.currentUser).toBeDisplayed()
    this.tabs = [firstTab, await browser.getWindowHandle()]
    await attachJson('Pestañas abiertas', { pestana1: this.tabs[0], pestana2: this.tabs[1] })
})

When('cambio a la pestaña {int}', async function (tabNumber) {
    await browser.switchToWindow(this.tabs[tabNumber - 1])
    await attachJson(`Estado de la pestaña ${tabNumber}`, await collectDiagnostics())
})

When('voy a {string} desde el menú', async (option) => {
    const links = { 'Habitaciones': Header.navRooms, 'Mis reservas': Header.navReservations }
    await links[option].click()
})

Then('debería ingresar a la página de habitaciones', async () => {
    await expect(browser).toHaveUrl(expect.stringContaining('/habitaciones'))
    await expect(Header.btnLogout).toBeDisplayed()
})

Then('debería ver el nombre {string} en la cabecera', async (fullName) => {
    await expect(Header.currentUser).toHaveText(fullName)
})

Then('debería ver el mensaje {string}', async (message) => {
    await expect(LoginPage.toast).toHaveText(message)
})

Then('debería ver el mensaje de error {string}', async (message) => {
    await expect(LoginPage.errorMessage).toHaveText(message)
})

Then('debería permanecer en la página de login', async () => {
    await expect(browser).toHaveUrl(expect.stringContaining('/login'))
    await expect(LoginPage.btnSubmit).toBeDisplayed()
})

Then('no debería ver los datos del usuario en la cabecera', async () => {
    await expect(Header.currentUser).not.toBeDisplayed()
    await expect(Header.btnLogout).not.toBeDisplayed()
})

Then('el campo contraseña debería estar enmascarado', async () => {
    await expect(LoginPage.inputPassword).toHaveAttribute('type', 'password')
})

Then('no debería ver el mensaje de error', async () => {
    await expect(LoginPage.errorMessage).not.toBeDisplayed()
})

Then('debería estar en la ruta {string}', async (path) => {
    await expect(browser).toHaveUrl(expect.stringContaining(path))
})

Then('debería ver el mensaje de página no encontrada', async () => {
    await expect($('main')).toHaveText(expect.stringContaining('Página no encontrada'))
})

Then('debería ver una solicitud de confirmación', async () => {
    let browserDialog = false
    try {
        await browser.getAlertText()
        browserDialog = true
    } catch {
        // no hay diálogo nativo del navegador
    }
    const appDialog = await $('[role="dialog"], [role="alertdialog"]').isDisplayed()
    expect(browserDialog || appDialog).toBe(true)
})

// Equivale a revisar los atributos del campo en DevTools > Elements
Then('el campo usuario debería estar marcado como inválido', async () => {
    const attributes = await browser.execute(() => [...document.querySelectorAll('#login-form input')]
        .map((input) => ({ id: input.id, 'aria-invalid': input.getAttribute('aria-invalid'), 'aria-describedby': input.getAttribute('aria-describedby') })))
    await logToConsole("document.querySelectorAll('#login-form input') → atributos de accesibilidad", attributes)
    await expect(LoginPage.inputUsername).toHaveAttribute('aria-invalid', 'true')
})

Then('el foco debería estar en el campo usuario', async () => {
    await logToConsole('document.activeElement.id', await browser.execute(() => document.activeElement.id))
    await expect(LoginPage.inputUsername).toBeFocused()
})
