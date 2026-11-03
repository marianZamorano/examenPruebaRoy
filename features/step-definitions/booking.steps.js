const { Given, When, Then } = require('@wdio/cucumber-framework')
const { browser, expect } = require('@wdio/globals')

const RoomsPage = require('../pageobjects/rooms.page')
const RoomDetailPage = require('../pageobjects/roomDetail.page')
const BookingModal = require('../pageobjects/components/bookingModal')
const MyBookingsPage = require('../pageobjects/myBookings.page')
const { isoFromToday, addDaysToIso, toDisplayDate, formatBs } = require('../support/formatters')
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
    await BookingModal.selectDates(checkIn, checkOut)
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
    this.booking = { room }
})

When('vuelvo al listado de habitaciones', async () => {
    await RoomDetailPage.backLink.click()
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

When('elijo un check-in dentro de {int} días por {int} noche(s)', async function (days, nights) {
    const { checkIn, checkOut } = chooseDates(this, days, nights)
    await BookingModal.selectDates(checkIn, checkOut)
})

When('elijo un check-in dentro de {int} días', async function (days) {
    this.booking = { ...this.booking, checkIn: isoFromToday(days) }
    await BookingModal.selectDay(this.booking.checkIn)
})

When('elijo en el calendario el día dentro de {int} días', async (days) => {
    await BookingModal.selectDay(isoFromToday(days))
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
    await expect(BookingModal.calendarHint).toHaveText(hint)
})

Then('el calendario debería pedir el check-out para un check-in dentro de {int} días', async (days) => {
    await expect(BookingModal.calendarHint).toHaveText(
        `Check-in ${toDisplayDate(isoFromToday(days))}. Elija el check-out (máx. 14 noches).`)
})

Then('el día dentro de {int} días debería estar {string} en el calendario', async (days, state) => {
    expect(await BookingModal.isDayEnabled(isoFromToday(days))).toBe(state === 'habilitado')
})

Then('el check-out a {int} noche(s) debería estar {string}', async function (nights, state) {
    expect(await BookingModal.isDayEnabled(addDaysToIso(this.booking.checkIn, nights))).toBe(state === 'habilitado')
})

Then('las noches reservadas deberían estar deshabilitadas en el calendario', async function () {
    const { checkIn, nights } = this.booking
    for (let i = 0; i < nights; i++) {
        expect(await BookingModal.isDayEnabled(addDaysToIso(checkIn, i))).toBe(false)
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

Then('la reserva no debería crearse', async function () {
    await expect(BookingModal.modal).toBeDisplayed()
    await expect(RoomDetailPage.toast).not.toBeDisplayed()
    const reservations = await myReservations()
    await logToConsole('Reservas del usuario antes / después de confirmar', { antes: this.reservationsBefore, despues: reservations.length })
    expect(reservations.length).toBe(this.reservationsBefore)
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

Then('la aplicación debería rechazarla con {string}', function (message) {
    expect(this.apiResult.ok).toBe(false)
    expect(this.apiResult.message).toBe(message)
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
