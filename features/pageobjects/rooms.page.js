const Page = require('./page')
const Header = require('./components/header')
const Calendar = require('./components/calendar')
const BookingModal = require('./components/bookingModal')

/**
* Listado de habitaciones (/habitaciones)
*/
class RoomsPage extends Page {
    searchCalendar = new Calendar('search')

    get title () { return $('main h1') }
    get resultsCount () { return $('#results-count') }
    get searchCheckIn () { return $('#search-checkin') }
    get searchCheckOut () { return $('#search-checkout') }
    get btnClearDates () { return $('#btn-clear-dates') }
    get btnNextPage () { return $('button[name="nextPage"]') }
    get firstRow () { return $('.rooms-table tbody tr:first-child') }

    // Fila de una habitación por su código (primera columna)
    row (roomCode) { return $(`//table[contains(@class,"rooms-table")]//tr[td[1][normalize-space()="${roomCode}"]]`) }
    availability (roomCode) { return this.row(roomCode).$('td:nth-child(6)') }
    detailLink (roomCode) { return this.row(roomCode).$('a') }
    btnBook (roomCode) { return this.row(roomCode).$('button') }

    // El listado está paginado: avanza de página hasta encontrar la habitación
    async showRoom (roomCode) {
        await this.firstRow.waitForDisplayed()
        while (!(await this.row(roomCode).isExisting()) && await this.btnNextPage.isEnabled()) {
            await this.btnNextPage.click()
        }
    }

    async openRoomDetail (roomCode) {
        await this.showRoom(roomCode)
        await this.detailLink(roomCode).click()
    }

    async openBookingModal (roomCode) {
        await this.showRoom(roomCode)
        await this.btnBook(roomCode).click()
        await BookingModal.modal.waitForDisplayed()
    }

    async searchDates (checkIn, checkOut) {
        await this.firstRow.waitForDisplayed()
        await this.searchCalendar.selectDates(checkIn, checkOut)
    }

    async goToMyBookings () {
        await Header.navReservations.click()
    }

    open () {
        return super.open('habitaciones')
    }
}

module.exports = new RoomsPage()
