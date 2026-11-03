const { Given, When, Then } = require('@wdio/cucumber-framework')
const { browser, expect } = require('@wdio/globals')

const RoomsPage = require('../pageobjects/rooms.page')
const RoomDetailPage = require('../pageobjects/roomDetail.page')
const BookingModal = require('../pageobjects/components/bookingModal')
const MyBookingsPage = require('../pageobjects/myBookings.page')
const { isoFromToday, addDaysToIso, toDisplayDate, formatBs, monthLabel } = require('../support/formatters')
const { logToConsole, attachJson } = require('../support/inspector')

const DB_KEY = 'hotel-qa:db'
const SESSION_KEY = 'hotel-qa:session'
const ARRIVAL_TIME = '18:00 - 20:00'

// Habitaciones y fechas usadas solo para llegar al límite de reservas activas
// (lejos de las fechas que usan los escenarios)
const FILLER_ROOMS = ['H101', 'H102', 'H103', 'H104', 'H106', 'H107']

// Reservas del usuario con sesión, leídas de la "base de datos" de la app (localStorage)
const myReservations = () => browser.execute((dbKey, sessionKey) => {
    const userId = localStorage.getItem(sessionKey)
    return JSON.parse(localStorage.getItem(dbKey)).reservations.filter((r) => r.userId === userId)
}, DB_KEY, SESSION_KEY)

const reservationsWithChosenDates = async ({ room, checkIn, checkOut }) =>
    (await myReservations()).filter((r) => r.roomId === room && r.checkIn === checkIn && r.checkOut === checkOut && !r.cancelledAt)

function chooseDates (world, days, nights) {
    const checkIn = isoFromToday(days)
    world.booking = { ...world.booking, checkIn, checkOut: addDaysToIso(checkIn, nights), nights }
    return world.booking
}

async function openRoom (world, room) {
    await RoomDetailPage.open(room)
    await expect(RoomDetailPage.title).toHaveText(`Habitación ${room}`)
    world.booking = { room }
}

async function confirmBooking (world) {
    world.reservationsBefore = (await myReservations()).length
    await BookingModal.confirm()
}

// Reserva completa desde el detalle de la habitación (sin verificar el resultado)
async function bookRoom (world, room, nights, days) {
    await openRoom(world, room)
    await RoomDetailPage.openBookingModal()
    const { checkIn, checkOut } = chooseDates(world, days, nights)
    await BookingModal.calendar.selectDates(checkIn, checkOut)
    await BookingModal.fillRequired(ARRIVAL_TIME)
    await confirmBooking(world)
}

async function expectConfirmation (world) {
    await expect(RoomDetailPage.toast).toHaveText(expect.stringMatching(/^Reserva R\d+ confirmada\.$/))
    world.booking.code = (await RoomDetailPage.toast.getText()).match(/R\d+/)[0]
    await attachJson('Reserva creada', world.booking)
}

// ---------- Listado y detalle ----------

Given('estoy en el detalle de la habitación {string}', async function (room) {
    await openRoom(this, room)
})

When('abro el detalle de la habitación {string} desde el listado', async function (room) {
    await RoomsPage.openRoomDetail(room)
    // Conserva las fechas buscadas en el listado, si las hay
    this.booking = { ...this.booking, room }
})

When('vuelvo al listado de habitaciones', async () => {
    await RoomDetailPage.backLink.click()
})

When('vuelvo al listado con {string}', async (option) => {
    if (option === 'Volver a habitaciones') await RoomDetailPage.backLink.click()
    else if (option === 'Atrás del navegador') await browser.back()
    else throw new Error(`Opción no soportada: ${option}`)
    await RoomsPage.firstRow.waitForDisplayed()
})

// ---------- Búsqueda por fechas y disponibilidad ----------

When('busco habitaciones con check-in dentro de {int} días por {int} noche(s)', async function (days, nights) {
    const checkIn = isoFromToday(days)
    this.booking = { checkIn, checkOut: addDaysToIso(checkIn, nights), nights }
    await RoomsPage.searchDates(this.booking.checkIn, this.booking.checkOut)
})

When('limpio las fechas de búsqueda', async () => {
    await RoomsPage.btnClearDates.click()
})

Then('la habitación {string} debería figurar como {string} en el listado', async (room, availability) => {
    await RoomsPage.showRoom(room)
    await expect(RoomsPage.availability(room)).toHaveText(availability)
})

Then('el detalle debería indicar {string}', async (status) => {
    await expect(RoomDetailPage.availability).toHaveText(status)
})

Then('el botón Reservar del detalle debería estar {string}', async (state) => {
    if (state === 'habilitado') await expect(RoomDetailPage.btnBook).toBeEnabled()
    else await expect(RoomDetailPage.btnBook).toBeDisabled()
})

Then('las fechas buscadas deberían conservarse', async function () {
    await expect(RoomsPage.searchCheckIn).toHaveValue(toDisplayDate(this.booking.checkIn))
    await expect(RoomsPage.searchCheckOut).toHaveValue(toDisplayDate(this.booking.checkOut))
})

Then('debería ver el listado con {string}', async (count) => {
    await expect(browser).toHaveUrl(expect.stringContaining('/habitaciones'))
    await expect(RoomsPage.resultsCount).toHaveText(count)
})

Then('debería ver el detalle de la habitación {string} con tipo {string}, capacidad {string}, tarifa {string}, piso {string} y vista {string}',
    async (room, type, capacity, rate, floor, view) => {
        await expect(RoomDetailPage.title).toHaveText(`Habitación ${room}`)
        await expect(RoomDetailPage.type).toHaveText(type)
        await expect(RoomDetailPage.capacity).toHaveText(capacity)
        await expect(RoomDetailPage.rate).toHaveText(rate)
        await expect(RoomDetailPage.floor).toHaveText(floor)
        await expect(RoomDetailPage.view).toHaveText(view)
    })

Then('debería ver los servicios {string}', async (amenities) => {
    const shown = await RoomDetailPage.amenities.map((item) => item.getText())
    expect(shown).toEqual(amenities.split(', '))
})

// ---------- Formulario de reserva ----------

When('abro el formulario de reserva', async () => {
    await RoomDetailPage.openBookingModal()
})

// Las dos formas de llegar al formulario: botón "Reservar" del detalle o de la fila del listado
When('abro el formulario de reserva de la habitación {string} desde {string}', async function (room, origin) {
    if (origin === 'el detalle') {
        await RoomsPage.openRoomDetail(room)
        await RoomDetailPage.openBookingModal()
    } else if (origin === 'el listado') {
        await RoomsPage.openBookingModal(room)
    } else {
        throw new Error(`Origen no soportado: ${origin}`)
    }
    this.booking = { ...this.booking, room }
})

When('elijo {int} huéspedes', async (guests) => {
    await BookingModal.setField('Huéspedes', String(guests))
})

// ---------- Navegación del calendario ----------

When('abro el calendario del formulario', async () => {
    await BookingModal.calendar.open()
})

When('abro el calendario desde el campo check-in', async () => {
    await BookingModal.calendar.inputCheckIn.click()
})

When('cierro el calendario con su botón', async () => {
    await BookingModal.calendar.btnToggle.click()
})

When('avanzo un mes en el calendario', async () => {
    await BookingModal.calendar.btnNextMonth.click()
})

When('retrocedo un mes en el calendario', async () => {
    await BookingModal.calendar.btnPrevMonth.click()
})

When('avanzo hasta el último mes del calendario', async () => {
    await BookingModal.calendar.goToLastMonth()
})

Then('el calendario debería mostrar el mes del día dentro de {int} días', async (days) => {
    await expect(BookingModal.calendar.month).toHaveText(monthLabel(isoFromToday(days)))
})

Then('el calendario debería mostrar el mes siguiente al actual', async () => {
    const [y, m] = isoFromToday(0).split('-').map(Number)
    await expect(BookingModal.calendar.month).toHaveText(monthLabel(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`))
})

Then('el botón de mes {string} del calendario debería estar {string}', async (which, state) => {
    const button = which === 'anterior' ? BookingModal.calendar.btnPrevMonth : BookingModal.calendar.btnNextMonth
    if (state === 'habilitado') await expect(button).toBeEnabled()
    else await expect(button).toBeDisabled()
})

Then('el calendario debería estar {string}', async (state) => {
    if (state === 'abierto') await expect(BookingModal.calendar.container).toBeDisplayed()
    else await expect(BookingModal.calendar.container).not.toBeExisting()
})

When('elijo un check-in dentro de {int} días por {int} noche(s)', async function (days, nights) {
    const { checkIn, checkOut } = chooseDates(this, days, nights)
    await BookingModal.calendar.selectDates(checkIn, checkOut)
})

When('elijo un check-in dentro de {int} días', async function (days) {
    this.booking = { ...this.booking, checkIn: isoFromToday(days) }
    await BookingModal.calendar.selectDay(this.booking.checkIn)
})

When('elijo en el calendario el día dentro de {int} días', async (days) => {
    await BookingModal.calendar.selectDay(isoFromToday(days))
})

When('completo la hora de llegada y acepto la política de cancelación', async () => {
    await BookingModal.fillRequired(ARRIVAL_TIME)
})

When('completo solo la hora de llegada', async () => {
    await BookingModal.setField('Hora de llegada', ARRIVAL_TIME)
})

When('acepto solo la política de cancelación', async () => {
    await BookingModal.setField('Política de cancelación', true)
})

When('cambio el campo {string} a {string}', async (label, value) => {
    await BookingModal.setField(label, value)
})

When('escribo {int} caracteres en solicitudes especiales', async (length) => {
    await BookingModal.setField('Solicitudes especiales', 'x'.repeat(length))
})

When('confirmo la reserva', async function () {
    await confirmBooking(this)
})

When('confirmo la reserva {int} veces seguidas', async function (times) {
    this.reservationsBefore = (await myReservations()).length
    await BookingModal.confirmRepeatedly(times)
})

When('cancelo el formulario de reserva', async () => {
    await BookingModal.cancel()
})

When('presiono la tecla Escape', async () => {
    await browser.keys('Escape')
})

Given('reservé la habitación {string} por {int} noche(s) con check-in dentro de {int} días', async function (room, nights, days) {
    await bookRoom(this, room, nights, days)
    await expectConfirmation(this)
    await expect(BookingModal.modal).not.toBeExisting()
})

When('intento reservar la habitación {string} por {int} noche(s) con check-in dentro de {int} días', async function (room, nights, days) {
    await bookRoom(this, room, nights, days)
})

// Crea reservas desde la interfaz hasta llegar al límite que muestra Mis reservas
Given('completé mis reservas activas hasta el límite', { timeout: 300000 }, async function () {
    await MyBookingsPage.open()
    const active = Number(await MyBookingsPage.activeCount.getText())
    const limit = Number(await MyBookingsPage.reservationLimit.getText())
    for (let i = 0; i < limit - active; i++) {
        await bookRoom(this, FILLER_ROOMS[i], 2, 60 + i * 5)
        await expectConfirmation(this)
    }
    await attachJson('Reservas activas antes del intento', { activas: limit, limite: limit, reservas: await myReservations() })
})

Then('el formulario debería mostrar {string}', async (subtitle) => {
    await expect(BookingModal.subtitle).toHaveText(subtitle)
})

Then('el formulario debería indicar check-in entre mañana y dentro de {int} días, de {int} a {int} noches', async (maxDays, minNights, maxNights) => {
    await expect(BookingModal.dateRange).toHaveText(
        `Check-in entre ${toDisplayDate(isoFromToday(1))} y ${toDisplayDate(isoFromToday(maxDays))} · de ${minNights} a ${maxNights} noches`)
})

Then('el botón Confirmar reserva debería estar {string}', async (state) => {
    if (state === 'habilitado') await expect(BookingModal.btnConfirm).toBeEnabled()
    else await expect(BookingModal.btnConfirm).toBeDisabled()
})

Then('el titular debería ser {string} y el correo {string}', async (name, email) => {
    await expect(BookingModal.inputGuestName).toHaveValue(name)
    await expect(BookingModal.inputGuestEmail).toHaveValue(email)
})

Then('el resumen debería mostrar {string} y un total de {string}', async function (nights, total) {
    await expect(BookingModal.inputCheckIn).toHaveValue(toDisplayDate(this.booking.checkIn))
    await expect(BookingModal.inputCheckOut).toHaveValue(toDisplayDate(this.booking.checkOut))
    await expect(BookingModal.nights).toHaveText(nights)
    await expect(BookingModal.total).toHaveText(total)
})

Then('el resumen no debería mostrar noches ni total', async () => {
    await expect(BookingModal.nights).toHaveText('—')
    await expect(BookingModal.total).toHaveText('—')
})

Then('el formulario de reserva debería estar vacío', async () => {
    await expect(BookingModal.inputCheckIn).toHaveValue('')
    await expect(BookingModal.inputCheckOut).toHaveValue('')
    await expect(BookingModal.nights).toHaveText('—')
    await expect(BookingModal.btnConfirm).toBeDisabled()
})

Then('el calendario debería indicar {string}', async (hint) => {
    await expect(BookingModal.calendar.hint).toHaveText(hint)
})

Then('el calendario debería pedir el check-out para un check-in dentro de {int} días', async (days) => {
    await expect(BookingModal.calendar.hint).toHaveText(
        `Check-in ${toDisplayDate(isoFromToday(days))}. Elija el check-out (máx. 14 noches).`)
})

Then('el día dentro de {int} días debería estar {string} en el calendario', async (days, state) => {
    expect(await BookingModal.calendar.isDayEnabled(isoFromToday(days))).toBe(state === 'habilitado')
})

Then('el check-out a {int} noche(s) debería estar {string}', async function (nights, state) {
    expect(await BookingModal.calendar.isDayEnabled(addDaysToIso(this.booking.checkIn, nights))).toBe(state === 'habilitado')
})

Then('las noches reservadas deberían estar deshabilitadas en el calendario', async function () {
    const { checkIn, nights } = this.booking
    for (let i = 0; i < nights; i++) {
        expect(await BookingModal.calendar.isDayEnabled(addDaysToIso(checkIn, i))).toBe(false)
    }
})

Then('el selector de huéspedes debería ofrecer de 1 a {int}', async (capacity) => {
    const options = await BookingModal.guestOptions.map((option) => option.getText())
    expect(options).toEqual(Array.from({ length: capacity }, (_, i) => String(i + 1)))
})

Then('el contador de solicitudes especiales debería mostrar {string}', async (count) => {
    await expect(BookingModal.specialRequestsCount).toHaveText(count)
})

// ---------- Resultado de la reserva ----------

Then('debería ver la confirmación de la reserva', async function () {
    await expectConfirmation(this)
})

Then('el formulario de reserva debería cerrarse', async () => {
    await expect(BookingModal.modal).not.toBeExisting()
})

Then('las fechas reservadas deberían figurar como ocupadas en el detalle', async function () {
    const { checkIn, checkOut } = this.booking
    await expect(RoomDetailPage.bookedDates).toHaveText(
        expect.stringContaining(`${toDisplayDate(checkIn)} → ${toDisplayDate(checkOut)}`))
})

Then('debería ver el error {string} en el campo {string}', async (message, label) => {
    await expect(BookingModal.fieldError(label)).toHaveText(message)
})

Then('debería ver un error en el campo {string}', async (label) => {
    await expect(BookingModal.fieldError(label)).toBeDisplayed()
})

Then('debería ver el error de la reserva {string}', async (message) => {
    await expect(BookingModal.formError).toHaveText(message)
})

// Primero se espera la respuesta de la app (confirmación o error): sin esa
// espera, la verificación podría pasar antes de que la reserva se guarde
Then('la reserva no debería crearse', async function () {
    await browser.waitUntil(async () => (await RoomDetailPage.toast.isDisplayed()) || (await BookingModal.formError.isDisplayed()),
        { timeoutMsg: 'La aplicación no respondió al confirmar la reserva' })
    const reservations = await myReservations()
    await logToConsole('Reservas del usuario antes / después de confirmar', { antes: this.reservationsBefore, despues: reservations.length })
    await attachJson('Reservas del usuario después de confirmar', reservations)
    expect(reservations.length).toBe(this.reservationsBefore)
    await expect(RoomDetailPage.toast).not.toBeDisplayed()
    await expect(BookingModal.modal).toBeDisplayed()
})

Then('debería existir una sola reserva con las fechas elegidas', async function () {
    const found = await reservationsWithChosenDates(this.booking)
    await attachJson('Reservas con las fechas elegidas', found)
    expect(found.length).toBe(1)
})

Then('no debería existir ninguna reserva con las fechas elegidas', async function () {
    expect((await reservationsWithChosenDates(this.booking)).length).toBe(0)
})

// ---------- Reglas validadas por la lógica de la aplicación ----------
// La app expone window.__hotelApi (la misma lógica que usa el formulario).
// Se le envían datos que el calendario no permite elegir.

async function requestReservation (world, room, days, nights, extra) {
    const checkIn = isoFromToday(days)
    const payload = {
        roomId: room,
        checkIn,
        checkOut: addDaysToIso(checkIn, nights),
        guests: 1,
        arrivalTime: ARRIVAL_TIME,
        specialRequests: '',
        acceptPolicy: true,
        ...extra
    }
    world.apiResult = await browser.execute(async (data, dbKey, sessionKey) => {
        const user = JSON.parse(localStorage.getItem(dbKey)).users.find((u) => u.id === localStorage.getItem(sessionKey))
        return window.__hotelApi.createReservation({ guestName: user.fullName, guestEmail: user.email, ...data })
    }, payload, DB_KEY, SESSION_KEY)
    await attachJson('Solicitud enviada a la aplicación', payload)
    await logToConsole('window.__hotelApi.createReservation(...)', world.apiResult)
}

When('solicito a la aplicación una reserva de {string} con check-in dentro de {int} días por {int} noche(s) para {int} huésped(es)',
    async function (room, days, nights, guests) {
        await requestReservation(this, room, days, nights, { guests })
    })

When('solicito a la aplicación una reserva de {string} con check-in dentro de {int} días por {int} noche(s) indicando un total de {int}',
    async function (room, days, nights, total) {
        await requestReservation(this, room, days, nights, { total, rate: total })
    })

When('solicito a la aplicación una reserva de {string} con check-in dentro de {int} días por {int} noche(s) a nombre del usuario {string}',
    async function (room, days, nights, username) {
        const userId = await browser.execute((dbKey, name) =>
            JSON.parse(localStorage.getItem(dbKey)).users.find((u) => u.username === name).id, DB_KEY, username)
        await requestReservation(this, room, days, nights, { userId })
    })

// Acción sobre una reserva activa de otro usuario (se busca por usuario, no por un código fijo)
When('solicito a la aplicación {string} una reserva activa de {string}', async function (action, username) {
    this.foreignReservation = await browser.execute((dbKey, name) => {
        const db = JSON.parse(localStorage.getItem(dbKey))
        const owner = db.users.find((u) => u.username === name)
        return db.reservations.find((r) => r.userId === owner.id && !r.cancelledAt && !r.noShow)
    }, DB_KEY, username)
    const checkIn = isoFromToday(60)
    this.apiResult = await browser.execute((act, id, dates) => act === 'cancelar'
        ? window.__hotelApi.cancelReservation(id)
        : window.__hotelApi.modifyReservation(id, dates), action, this.foreignReservation.id, { checkIn, checkOut: addDaysToIso(checkIn, 2) })
    await logToConsole(`window.__hotelApi: ${action} ${this.foreignReservation.id} (de ${username})`, this.apiResult)
})

Then('la aplicación debería rechazarla con {string}', function (message) {
    expect(this.apiResult.ok).toBe(false)
    expect(this.apiResult.message).toBe(message)
})

Then('la aplicación debería rechazar la reserva', async function () {
    await attachJson('Respuesta de la aplicación', this.apiResult)
    expect(this.apiResult.ok).toBe(false)
})

Then('la reserva guardada debería pertenecer al usuario {string}', async function (username) {
    expect(this.apiResult.ok).toBe(true)
    const owner = await browser.execute((dbKey, name) =>
        JSON.parse(localStorage.getItem(dbKey)).users.find((u) => u.username === name).id, DB_KEY, username)
    await attachJson('Reserva guardada', this.apiResult.data)
    expect(this.apiResult.data.userId).toBe(owner)
})

Then('la reserva de {string} no debería cambiar', async function (_username) {
    const current = await browser.execute((dbKey, id) =>
        JSON.parse(localStorage.getItem(dbKey)).reservations.find((r) => r.id === id), DB_KEY, this.foreignReservation.id)
    await attachJson('Reserva ajena antes / después', { antes: this.foreignReservation, despues: current })
    expect(current).toEqual(this.foreignReservation)
})

Then('la reserva guardada debería tener un total de {string}', async function (total) {
    expect(this.apiResult.ok).toBe(true)
    const saved = (await myReservations()).find((r) => r.id === this.apiResult.data.id)
    await attachJson('Reserva guardada en localStorage', saved)
    expect(formatBs(saved.total)).toBe(total)
})

// ---------- Accesibilidad ----------

Then('el foco debería estar dentro del formulario de reserva', async () => {
    const focused = await browser.execute(() => document.activeElement.outerHTML.slice(0, 200))
    await logToConsole('document.activeElement', focused)
    expect(await browser.execute(() => !!document.activeElement.closest('#reservation-modal'))).toBe(true)
})

Then('el campo {string} del formulario debería estar marcado como inválido', async (label) => {
    await expect(BookingModal.field(label)).toHaveAttribute('aria-invalid', 'true')
})

Then('el foco debería estar en el campo {string} del formulario', async (label) => {
    await logToConsole('document.activeElement', await browser.execute(() => document.activeElement.outerHTML.slice(0, 200)))
    await expect(BookingModal.field(label)).toBeFocused()
})
