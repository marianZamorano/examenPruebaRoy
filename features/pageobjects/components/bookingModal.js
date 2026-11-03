const { browser } = require('@wdio/globals')
const Calendar = require('./calendar')

// Nombre visible de cada campo → atributo name (también da el id de su mensaje de error)
const FIELDS = {
    'Huéspedes': 'guestCount',
    'Titular': 'guestName',
    'Correo': 'guestEmail',
    'Hora de llegada': 'arrivalTime',
    'Solicitudes especiales': 'specialRequests',
    'Política de cancelación': 'acceptPolicy'
}

/**
* Modal "Reservar habitación" que se abre desde el detalle de una habitación.
* Es un componente (no una página), por eso no extiende de Page.
*/
class BookingModal {
    calendar = new Calendar('reservation')

    get modal () { return $('#reservation-modal') }
    get subtitle () { return $('#reservation-room') }
    get dateRange () { return $('#reservation-date-range') }
    get inputCheckIn () { return $('#reservation-checkin') }
    get inputCheckOut () { return $('#reservation-checkout') }
    get guestOptions () { return $$('select[name="guestCount"] option') }
    get inputGuestName () { return $('input[name="guestName"]') }
    get inputGuestEmail () { return $('input[name="guestEmail"]') }
    get selectArrivalTime () { return $('select[name="arrivalTime"]') }
    get inputSpecialRequests () { return $('textarea[name="specialRequests"]') }
    get specialRequestsCount () { return $('#specialRequests-count') }
    get checkboxPolicy () { return $('input[name="acceptPolicy"]') }
    get nights () { return $('#reservation-nights') }
    get rate () { return $('#reservation-rate') }
    get total () { return $('#reservation-total') }
    get formError () { return $('#reservation-error') }
    get btnCancel () { return $('#btn-cancel-reservation') }
    get btnConfirm () { return $('#btn-confirm-reservation') }

    field (label) { return $(`#reservation-modal [name="${FIELDS[label]}"]`) }
    fieldError (label) { return $(`#${FIELDS[label]}-error`) }

    // Borra el campo con el teclado (como un usuario) para que la app registre el cambio
    async clearAndType (input, text) {
        await input.click()
        await browser.keys(['Control', 'a'])
        await browser.keys('Backspace')
        if (text) await input.addValue(text)
    }

    async setField (label, value) {
        const input = this.field(label)
        if (label === 'Hora de llegada' || label === 'Huéspedes') {
            await input.selectByAttribute('value', value)
        } else if (label === 'Política de cancelación') {
            if ((await input.isSelected()) !== value) await input.click()
        } else {
            await this.clearAndType(input, value)
        }
    }

    async fillRequired (arrivalTime) {
        await this.setField('Hora de llegada', arrivalTime)
        await this.setField('Política de cancelación', true)
    }

    async confirm () {
        await this.btnConfirm.click()
    }

    // Clics seguidos sin esperar entre ellos (como un doble clic impaciente)
    async confirmRepeatedly (times) {
        await browser.execute((n) => {
            const button = document.querySelector('#btn-confirm-reservation')
            for (let i = 0; i < n; i++) button.click()
        }, times)
    }

    async cancel () {
        await this.btnCancel.click()
    }
}

module.exports = new BookingModal()
