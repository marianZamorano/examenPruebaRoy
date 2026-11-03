const Calendar = require('./calendar')

// Opciones visibles del formulario → id del radio
const OPTIONS = {
    'Mantener las noches': '#modify-mode-same',
    'Elegir nuevas fechas': '#modify-mode-custom'
}

/**
* Modal "Modificar fechas" que se abre desde una fila de Mis reservas.
* Usa el mismo calendario que la búsqueda y la reserva, con el prefijo "modify".
*/
class ModifyModal {
    calendar = new Calendar('modify')

    get modal () { return $('#modify-modal') }
    get subtitle () { return $('#modify-room') }
    get currentDates () { return $('#modify-current-dates') }
    get currentNights () { return $('#modify-current-nights') }
    get optionLabels () { return $$('#modify-modal .option-list label') }
    get dateRange () { return $('#modify-date-range') }
    get newDates () { return $('#modify-new-dates') }
    get newNights () { return $('#modify-new-nights') }
    get newTotal () { return $('#modify-new-total') }
    get error () { return $('#modify-error') }
    get btnCancel () { return $('#btn-cancel-modify') }
    get btnSave () { return $('#btn-confirm-modify') }

    option (label) { return $(OPTIONS[label]) }

    async chooseOption (label) {
        await this.option(label).click()
    }

    // "Mantener N noches": solo se elige el nuevo check-in
    async keepNights (checkIn) {
        await this.chooseOption('Mantener las noches')
        await this.calendar.selectDay(checkIn)
    }

    // "Elegir nuevas fechas": check-in y check-out en el calendario de rango
    async chooseNewDates (checkIn, checkOut) {
        await this.chooseOption('Elegir nuevas fechas')
        await this.calendar.selectDates(checkIn, checkOut)
    }

    async save () {
        await this.btnSave.click()
    }

    async close () {
        await this.btnCancel.click()
    }
}

module.exports = new ModifyModal()
