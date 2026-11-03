const { Given, When, Then } = require('@wdio/cucumber-framework')
const { expect } = require('@wdio/globals')

const MyBookingsPage = require('../pageobjects/myBookings.page')
const { toDisplayDate } = require('../support/formatters')
const { attachJson } = require('../support/inspector')

// La reserva se identifica por el código que mostró la confirmación (this.booking.code)

Then('debería ver {string} en Mis reservas', async (summary) => {
    await expect(MyBookingsPage.activeSummary).toHaveText(summary)
})

Then('debería ver la reserva con habitación {string}, {int} noche(s), {int} huésped(es) y total {string}', async function (room, nights, guests, total) {
    const { code, checkIn, checkOut } = this.booking
    await expect(MyBookingsPage.row(code)).toBeDisplayed()
    await attachJson('Fila de la reserva en Mis reservas', { codigo: code, fila: await MyBookingsPage.row(code).getText() })
    await expect(MyBookingsPage.cell(code, 'room')).toHaveText(room)
    await expect(MyBookingsPage.cell(code, 'check-in')).toHaveText(toDisplayDate(checkIn))
    await expect(MyBookingsPage.cell(code, 'check-out')).toHaveText(toDisplayDate(checkOut))
    await expect(MyBookingsPage.cell(code, 'nights')).toHaveText(String(nights))
    await expect(MyBookingsPage.cell(code, 'guests')).toHaveText(String(guests))
    await expect(MyBookingsPage.cell(code, 'total')).toHaveText(total)
})

Then('la reserva debería estar {string} con modificaciones {string}', async function (status, modifications) {
    await expect(MyBookingsPage.cell(this.booking.code, 'status')).toHaveText(status)
    await expect(MyBookingsPage.cell(this.booking.code, 'modifications')).toHaveText(modifications)
})

Then('la reserva debería permitir modificar fechas y cancelar', async function () {
    await expect(MyBookingsPage.btnModify(this.booking.code)).toBeEnabled()
    await expect(MyBookingsPage.btnCancel(this.booking.code)).toBeEnabled()
})

// TODO: steps de modificar fechas y cancelar (inciso 4)
