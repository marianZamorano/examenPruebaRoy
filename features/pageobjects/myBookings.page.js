const Page = require('./page')

/**
* Mis reservas (/mis-reservas)
*/
class MyBookingsPage extends Page {
    // TODO: getters de selectores (tabla, fila por código, botones "Modificar fechas" y "Cancelar", estado)

    async modifyDates (bookingCode, checkIn, checkOut) {
        // TODO
    }

    async cancelBooking (bookingCode) {
        // TODO
    }

    open () {
        return super.open('mis-reservas')
    }
}

module.exports = new MyBookingsPage()
