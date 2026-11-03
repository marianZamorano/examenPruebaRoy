const Page = require('./page')
const Header = require('./components/header')

/**
* Listado de habitaciones (/habitaciones)
*/
class RoomsPage extends Page {
    get title () { return $('main h1') }
    get resultsCount () { return $('#results-count') }
    get btnNextPage () { return $('button[name="nextPage"]') }
    get firstRow () { return $('.rooms-table tbody tr:first-child') }

    detailLink (roomCode) { return $(`a[href="/habitaciones/${roomCode}"]`) }

    // El listado está paginado: avanza de página hasta encontrar la habitación
    async openRoomDetail (roomCode) {
        await this.firstRow.waitForDisplayed()
        while (!(await this.detailLink(roomCode).isExisting()) && await this.btnNextPage.isEnabled()) {
            await this.btnNextPage.click()
        }
        await this.detailLink(roomCode).click()
    }

    async goToMyBookings () {
        await Header.navReservations.click()
    }

    open () {
        return super.open('habitaciones')
    }
}

module.exports = new RoomsPage()
