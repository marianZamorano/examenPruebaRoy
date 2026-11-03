const Page = require('./page')

/**
* Listado de habitaciones (/habitaciones)
*/
class RoomsPage extends Page {
    // TODO: getters de selectores (título, tabla, links "Ver detalle", menú "Mis reservas")

    async openRoomDetail (roomCode) {
        // TODO
    }

    async goToMyBookings () {
        // TODO
    }

    open () {
        return super.open('habitaciones')
    }
}

module.exports = new RoomsPage()
