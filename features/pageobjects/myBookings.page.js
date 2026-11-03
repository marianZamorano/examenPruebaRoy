const Page = require('./page')
const ModifyModal = require('./components/modifyModal')

// Filtros visibles → atributo data-filter
const FILTERS = {
    'Todas': 'todas',
    'Confirmadas': 'confirmada',
    'En curso': 'en-curso',
    'Finalizadas': 'finalizada',
    'Canceladas': 'cancelada',
    'No presentado': 'no-presentado'
}

/**
* Mis reservas (/mis-reservas)
*/
class MyBookingsPage extends Page {
    get title () { return $('main h1') }
    get activeSummary () { return $('.page-head .muted') }
    get activeCount () { return $('#active-reservations-count') }
    get reservationLimit () { return $('#reservation-limit') }
    get headers () { return $$('.reservations-table thead th') }
    get rows () { return $$('.reservations-table tbody tr') }
    get statusCells () { return $$('.reservations-table td[data-col="status"]') }
    get emptyMessage () { return $('#reservations-empty') }
    get activeFilter () { return $('.segmented [aria-pressed="true"]') }
    get error () { return $('#reservations-error') }

    // Diálogo de confirmación de la cancelación
    get cancelDialog () { return $('#cancel-dialog') }
    get cancelDialogTitle () { return $('#cancel-dialog-title') }
    get cancelDialogMessage () { return $('#cancel-dialog-message') }
    get btnKeepBooking () { return $('#cancel-dialog-cancel') }
    get btnConfirmCancel () { return $('#cancel-dialog-accept') }

    row (bookingCode) { return $(`tr[data-reservation-id="${bookingCode}"]`) }
    cell (bookingCode, column) { return $(`tr[data-reservation-id="${bookingCode}"] td[data-col="${column}"]`) }
    btnModify (bookingCode) { return $(`button[name="modify-${bookingCode}"]`) }
    btnCancel (bookingCode) { return $(`button[name="cancel-${bookingCode}"]`) }
    rowButtons (bookingCode) { return $$(`tr[data-reservation-id="${bookingCode}"] button`) }
    filter (label) { return $(`button[data-filter="${FILTERS[label]}"]`) }

    // Código y estado de cada fila visible
    async visibleReservations () {
        return this.rows.map(async (row) => ({
            code: await row.getAttribute('data-reservation-id'),
            status: await row.$('td[data-col="status"]').getText()
        }))
    }

    async filterBy (label) {
        await this.filter(label).click()
    }

    async openModify (bookingCode) {
        await this.btnModify(bookingCode).click()
        await ModifyModal.modal.waitForDisplayed()
    }

    async modifyDates (bookingCode, checkIn, checkOut) {
        await this.openModify(bookingCode)
        await ModifyModal.chooseNewDates(checkIn, checkOut)
        await ModifyModal.save()
    }

    async openCancel (bookingCode) {
        await this.btnCancel(bookingCode).click()
        await this.cancelDialog.waitForDisplayed()
    }

    async cancelBooking (bookingCode) {
        await this.openCancel(bookingCode)
        await this.btnConfirmCancel.click()
    }

    open () {
        return super.open('mis-reservas')
    }
}

module.exports = new MyBookingsPage()
