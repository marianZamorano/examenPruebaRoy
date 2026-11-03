const Page = require('./page')

/**
* Mis reservas (/mis-reservas)
*/
class MyBookingsPage extends Page {
    get activeSummary () { return $('.page-head .muted') }
    get activeCount () { return $('#active-reservations-count') }
    get reservationLimit () { return $('#reservation-limit') }
    get rows () { return $$('.reservations-table tbody tr') }
    get emptyMessage () { return $('#reservations-empty') }

    row (bookingCode) { return $(`tr[data-reservation-id="${bookingCode}"]`) }
    cell (bookingCode, column) { return $(`tr[data-reservation-id="${bookingCode}"] td[data-col="${column}"]`) }
    btnModify (bookingCode) { return $(`button[name="modify-${bookingCode}"]`) }
    btnCancel (bookingCode) { return $(`button[name="cancel-${bookingCode}"]`) }

    async modifyDates (bookingCode, checkIn, checkOut) {
        // TODO (inciso 4)
    }

    async cancelBooking (bookingCode) {
        // TODO (inciso 4)
    }

    open () {
        return super.open('mis-reservas')
    }
}

module.exports = new MyBookingsPage()
