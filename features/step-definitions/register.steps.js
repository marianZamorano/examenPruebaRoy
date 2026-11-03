const { Given, When, Then } = require('@wdio/cucumber-framework')
const { browser, expect } = require('@wdio/globals')

const RegisterPage = require('../pageobjects/register.page')
const LoginPage = require('../pageobjects/login.page')
const Header = require('../pageobjects/components/header')
const BookingModal = require('../pageobjects/components/bookingModal')
const { newUserData, uniqueSuffix } = require('../support/userData')
const { logToConsole, attachJson } = require('../support/inspector')

const DB_KEY = 'hotel-qa:db'
const SESSION_KEY = 'hotel-qa:session'

// "Base de datos" de la app (localStorage)
const storedDb = () => browser.execute((key) => JSON.parse(localStorage.getItem(key)), DB_KEY)
const storedUsers = async () => (await storedDb()).users
const storedUser = async (username) => (await storedUsers()).find((u) => u.username.toLowerCase() === username.trim().toLowerCase())

// Campos de texto cuyo valor escrito se recuerda para verificarlo después
const USER_KEYS = { 'Nombre completo': 'fullName', 'Correo': 'email', 'Usuario': 'username', 'Contraseña': 'password' }

async function openRegisterPage () {
    await RegisterPage.open()
    await RegisterPage.form.waitForDisplayed()
}

async function submitRegister (world) {
    world.usersBefore = (await storedUsers()).length
    await RegisterPage.submit()
}

async function expectAccountCreated (world) {
    await expect(RegisterPage.toast).toHaveText(`Cuenta creada para ${world.newUser.username.trim()}. Inicie sesión.`)
    await attachJson('Usuario registrado', world.newUser)
}

// Registro completo desde la interfaz con datos únicos
async function registerNewUser (world, userType) {
    await openRegisterPage()
    world.newUser = newUserData(userType)
    await RegisterPage.fillForm(world.newUser)
    await submitRegister(world)
    await expectAccountCreated(world)
}

// Espera a que se cargue la página con la cabecera del usuario: las verificaciones
// siguientes deben hacerse sobre la página ya ingresada, no sobre el login
async function loginAsNewUser (world) {
    if (!(await LoginPage.btnSubmit.isExisting())) await LoginPage.open()
    await LoginPage.login(world.newUser.username, world.newUser.password)
    await Header.currentUser.waitForDisplayed()
}

// ---------- Navegación ----------

Given('que estoy en la página de registro', async () => {
    await openRegisterPage()
})

When('voy al registro desde el login', async () => {
    await LoginPage.linkRegister.click()
    await RegisterPage.form.waitForDisplayed()
})

When('vuelvo al login desde el registro', async () => {
    await RegisterPage.linkLogin.click()
})

Then('debería ver el formulario de registro', async () => {
    await expect(RegisterPage.title).toHaveText('Crear cuenta')
})

// ---------- Completar y enviar ----------

When('completo el registro con datos válidos de tipo {string}', async function (userType) {
    this.newUser = newUserData(userType)
    this.registered = [...(this.registered || []), this.newUser]
    await RegisterPage.fillForm(this.newUser)
})

// "Términos" acepta "si" o "no"
When('cambio el campo de registro {string} a {string}', async function (label, value) {
    const fieldValue = label === 'Términos' ? value === 'si' : value
    await RegisterPage.setField(label, fieldValue)
    if (USER_KEYS[label]) this.newUser[USER_KEYS[label]] = value
})

When('cambio el campo de registro {string} a un texto de {int} caracteres', async function (label, length) {
    // El usuario debe ser único: se completa un sufijo único hasta el largo pedido
    const value = label === 'Usuario'
        ? `u${uniqueSuffix()}${'x'.repeat(length)}`.slice(0, length)
        : 'Nombre'.repeat(Math.ceil(length / 6)).slice(0, length)
    await RegisterPage.setField(label, value)
    if (USER_KEYS[label]) this.newUser[USER_KEYS[label]] = value
})

When('cambio la contraseña y su confirmación a {string}', async function (password) {
    await RegisterPage.setField('Contraseña', password)
    await RegisterPage.setField('Confirmar contraseña', password)
    this.newUser.password = password
})

// Un usuario que también cumple la política de contraseña (mayúscula, número, 8+)
When('uso el mismo valor como usuario y contraseña', async function () {
    const value = `Pr1${uniqueSuffix()}`.slice(0, 16)
    await RegisterPage.setField('Usuario', value)
    await RegisterPage.setField('Contraseña', value)
    await RegisterPage.setField('Confirmar contraseña', value)
    this.newUser.username = value
    this.newUser.password = value
})

When('agrego al formulario de registro el tipo de usuario {string}', async (userType) => {
    await RegisterPage.addUserTypeOption(userType)
    await logToConsole('select[name="userType"] → opción agregada desde DevTools', userType)
})

When('envío el registro', async function () {
    await submitRegister(this)
})

Given('me registro como un usuario {string}', async function (userType) {
    await registerNewUser(this, userType)
})

Given('me registré e inicié sesión como un usuario {string}', async function (userType) {
    await registerNewUser(this, userType)
    await loginAsNewUser(this)
    await expect(browser).toHaveUrl(expect.stringContaining('/habitaciones'))
})

When('inicio sesión con el usuario nuevo', async function () {
    await loginAsNewUser(this)
})

// ---------- Registro en dos pestañas ----------

When('abro el registro en una nueva pestaña', async function () {
    const firstTab = await browser.getWindowHandle()
    const before = await browser.getWindowHandles()
    await browser.newWindow(`${browser.options.baseUrl}/registro`, { type: 'tab' })
    const opened = (await browser.getWindowHandles()).filter((handle) => !before.includes(handle))
    for (const handle of opened) {
        await browser.switchToWindow(handle)
        if ((await browser.getUrl()).startsWith(browser.options.baseUrl)) break
    }
    await RegisterPage.form.waitForDisplayed()
    this.tabs = [firstTab, await browser.getWindowHandle()]
})

When('completo el registro con el mismo usuario de la pestaña 1 y otro correo', async function () {
    this.newUser = { ...newUserData('Huésped'), username: this.registered[0].username }
    await RegisterPage.fillForm(this.newUser)
})

// ---------- Resultado del registro ----------

Then('debería ver que la cuenta del usuario nuevo fue creada', async function () {
    await expectAccountCreated(this)
})

Then('debería estar en la página de login sin sesión iniciada', async () => {
    await expect(browser).toHaveUrl(expect.stringContaining('/login'))
    await expect(LoginPage.btnSubmit).toBeDisplayed()
    const session = await browser.execute((key) => localStorage.getItem(key), SESSION_KEY)
    await logToConsole(`localStorage.getItem('${SESSION_KEY}')`, session)
    expect(session).toBeNull()
})

Then('debería ver el error de registro {string} en el campo {string}', async (message, label) => {
    await expect(RegisterPage.fieldError(label)).toHaveText(message)
})

Then('debería ver un error de registro en el campo {string}', async (label) => {
    await expect(RegisterPage.fieldError(label)).toBeDisplayed()
})

Then('debería ver el error general del registro {string}', async (message) => {
    await expect(RegisterPage.formError).toHaveText(message)
})

// Se espera la respuesta de la app (error o confirmación) antes de contar los usuarios
Then('la cuenta no debería crearse', async function () {
    await browser.waitUntil(async () => (await RegisterPage.formError.isDisplayed()) || (await RegisterPage.toast.isDisplayed()),
        { timeoutMsg: 'La aplicación no respondió al enviar el registro' })
    const users = await storedUsers()
    await logToConsole('Usuarios guardados antes / después de enviar', { antes: this.usersBefore, despues: users.length })
    expect(users.length).toBe(this.usersBefore)
    await expect(browser).toHaveUrl(expect.stringContaining('/registro'))
})

Then('el usuario nuevo debería guardarse con rol {string}, estado {string} y tipo {string}', async function (role, status, userType) {
    const user = await storedUser(this.newUser.username)
    const { password, ...visible } = user
    await attachJson('Usuario guardado en localStorage (sin contraseña)', visible)
    expect(user.role).toBe(role)
    expect(user.status).toBe(status)
    expect(user.userType).toBe(userType)
})

Then('el usuario nuevo debería tener un identificador que no usa ningún otro usuario', async function () {
    const users = await storedUsers()
    const user = users.find((u) => u.username === this.newUser.username.trim())
    await logToConsole('Identificadores de usuarios', users.map((u) => `${u.id} ${u.username}`))
    expect(users.filter((u) => u.id === user.id).length).toBe(1)
})

Then('el nombre y el correo del usuario nuevo deberían guardarse sin espacios alrededor', async function () {
    const user = await storedUser(this.newUser.username)
    expect(user.fullName).toBe(this.newUser.fullName.trim())
    expect(user.email).toBe(this.newUser.email.trim())
})

Then('la contraseña del usuario nuevo no debería guardarse legible', async function () {
    const user = await storedUser(this.newUser.username)
    await logToConsole(`usuario "${user.username}" en localStorage['${DB_KEY}']`, { username: user.username, password: user.password })
    await attachJson('Usuario nuevo guardado en localStorage', user)
    const storage = await browser.execute(() => JSON.stringify({ ...localStorage }))
    expect({ contraseñaLegibleEnElAlmacenamiento: storage.includes(this.newUser.password) })
        .toEqual({ contraseñaLegibleEnElAlmacenamiento: false })
})

Then('los dos usuarios deberían guardarse con identificadores distintos', async function () {
    const [first, second] = await Promise.all(this.registered.map((u) => storedUser(u.username)))
    await attachJson('Usuarios registrados en cada pestaña', [first, second].map(({ password, ...u }) => u))
    expect(first.id).not.toBe(second.id)
})

// Prueba las tres formas de escribir el dato de un usuario existente
async function expectDuplicateRejected (world, label, existingValue, message) {
    const variants = { exacto: existingValue, 'en mayúsculas': existingValue.toUpperCase(), 'con espacios': `  ${existingValue}  ` }
    const results = {}
    for (const [variant, value] of Object.entries(variants)) {
        await openRegisterPage()
        await RegisterPage.fillForm({ ...newUserData('Huésped'), [USER_KEYS[label]]: value })
        await submitRegister(world)
        await expect(RegisterPage.fieldError(label)).toHaveText(message)
        results[variant] = { valor: value, usuarios: (await storedUsers()).length }
        expect(results[variant].usuarios).toBe(world.usersBefore)
    }
    await attachJson(`${label} duplicado: ${existingValue}`, results)
}

Then('no debería poder registrarse con el usuario de {string} exacto, en mayúsculas ni con espacios', async function (username) {
    await expectDuplicateRejected(this, 'Usuario', username, 'El usuario ya existe.')
})

Then('no debería poder registrarse con el correo de {string} exacto, en mayúsculas ni con espacios', async function (username) {
    const { email } = await storedUser(username)
    await expectDuplicateRejected(this, 'Correo', email, 'El correo ya está registrado.')
})

Then('no debería poder registrarse con el usuario y el correo del usuario nuevo en mayúsculas', async function () {
    await expectDuplicateRejected(this, 'Usuario', this.newUser.username, 'El usuario ya existe.')
    await expectDuplicateRejected(this, 'Correo', this.newUser.email, 'El correo ya está registrado.')
})

// ---------- Integridad de los datos existentes ----------

Given('guardo los datos de los usuarios y reservas existentes', async function () {
    if (!(await LoginPage.btnSubmit.isExisting())) await LoginPage.open()
    this.snapshot = await storedDb()
})

Then('los usuarios y las reservas existentes no deberían cambiar', async function () {
    const current = await storedDb()
    const userIds = this.snapshot.users.map((u) => u.id)
    const reservationIds = this.snapshot.reservations.map((r) => r.id)
    const usersNow = current.users.filter((u) => userIds.includes(u.id))
    const reservationsNow = current.reservations.filter((r) => reservationIds.includes(r.id))
    await attachJson('Datos nuevos agregados', {
        usuarios: current.users.filter((u) => !userIds.includes(u.id)).map(({ password, ...u }) => u),
        reservas: current.reservations.filter((r) => !reservationIds.includes(r.id))
    })
    expect(usersNow).toEqual(this.snapshot.users)
    expect(reservationsNow).toEqual(this.snapshot.reservations)
})

// ---------- Primer ingreso ----------

Then('debería ver el nombre del usuario nuevo en la cabecera', async function () {
    await expect(Header.currentUser).toHaveText(this.newUser.fullName.trim())
})

Then('debería ver la bienvenida del usuario nuevo', async function () {
    await expect(LoginPage.toast).toHaveText(`Bienvenido, ${this.newUser.fullName.trim()}`)
})

Then('el titular de la reserva debería ser el usuario nuevo', async function () {
    await expect(BookingModal.inputGuestName).toHaveValue(this.newUser.fullName.trim())
    await expect(BookingModal.inputGuestEmail).toHaveValue(this.newUser.email.trim())
})

Then('la página no debería desplazarse horizontalmente', async () => {
    const widths = await browser.execute(() => ({ pagina: document.documentElement.scrollWidth, ventana: document.documentElement.clientWidth }))
    await logToConsole('Ancho de la página / de la ventana (px)', widths)
    expect(widths.pagina).toBeLessThanOrEqual(widths.ventana)
})

Then('el botón Cerrar sesión debería estar visible en la pantalla', async () => {
    expect(await Header.btnLogout.isDisplayed({ withinViewport: true })).toBe(true)
})

// ---------- Accesibilidad ----------

Then('el campo de registro {string} debería estar marcado como inválido', async (label) => {
    const attributes = await browser.execute(() => [...document.querySelectorAll('form[name="registerForm"] [name]')]
        .map((input) => ({ name: input.name, 'aria-invalid': input.getAttribute('aria-invalid'), 'aria-describedby': input.getAttribute('aria-describedby') })))
    await logToConsole("document.querySelectorAll('form[name=registerForm] [name]') → atributos de accesibilidad", attributes)
    await expect(RegisterPage.field(label)).toHaveAttribute('aria-invalid', 'true')
})

Then('el foco debería estar en el campo de registro {string}', async (label) => {
    await logToConsole('document.activeElement', await browser.execute(() => document.activeElement.outerHTML.slice(0, 200)))
    await expect(RegisterPage.field(label)).toBeFocused()
})
