const { browser, expect } = require('@wdio/globals')

const RoomDetailPage = require('../pageobjects/roomDetail.page')
const BookingModal = require('../pageobjects/components/bookingModal')
const { isoFromToday, addDaysToIso } = require('./formatters')
const { attachJson } = require('./inspector')

/**
* Acciones de reserva compartidas por los steps de los incisos 2, 3 y 4:
* crear una reserva desde la interfaz y leer las reservas guardadas por la app.
*/
const DB_KEY = 'hotel-qa:db'
const SESSION_KEY = 'hotel-qa:session'
const ARRIVAL_TIME = '18:00 - 20:00'

// Reservas del usuario con sesión, leídas de la "base de datos" de la app (localStorage)
const myReservations = () => browser.execute((dbKey, sessionKey) => {
    const userId = localStorage.getItem(sessionKey)
    return JSON.parse(localStorage.getItem(dbKey)).reservations.filter((r) => r.userId === userId)
}, DB_KEY, SESSION_KEY)

// Una reserva guardada, de cualquier usuario
const storedReservation = (id) => browser.execute((dbKey, reservationId) =>
    JSON.parse(localStorage.getItem(dbKey)).reservations.find((r) => r.id === reservationId), DB_KEY, id)

// Primera reserva activa (no cancelada ni finalizada) de un usuario existente
const upcomingReservationOf = (username) => browser.execute((dbKey, name, from) => {
    const db = JSON.parse(localStorage.getItem(dbKey))
    const owner = db.users.find((u) => u.username === name)
    return db.reservations.find((r) => r.userId === owner.id && !r.cancelledAt && !r.noShow && r.checkIn > from)
}, DB_KEY, username, isoFromToday(0))

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

// Guarda también las reservas anteriores del escenario (world.bookings), para los
// escenarios que trabajan con más de una reserva
async function expectConfirmation (world) {
    await expect(RoomDetailPage.toast).toHaveText(expect.stringMatching(/^Reserva R\d+ confirmada\.$/))
    world.booking.code = (await RoomDetailPage.toast.getText()).match(/R\d+/)[0]
    world.bookings = [...(world.bookings || []), { ...world.booking }]
    await attachJson('Reserva creada', world.booking)
}

module.exports = {
    DB_KEY,
    SESSION_KEY,
    ARRIVAL_TIME,
    myReservations,
    storedReservation,
    upcomingReservationOf,
    chooseDates,
    openRoom,
    confirmBooking,
    bookRoom,
    expectConfirmation
}
