const Page = require('./page')

/**
* Detalle de una habitación (/habitaciones/:codigo)
*/
class RoomDetailPage extends Page {
    // TODO: getters de selectores (título "Habitación Hxxx", tarifa, botón "Reservar esta habitación")

    async openBookingModal () {
        // TODO
    }

    open (roomCode) {
        return super.open(`habitaciones/${roomCode}`)
    }
}

module.exports = new RoomDetailPage()
