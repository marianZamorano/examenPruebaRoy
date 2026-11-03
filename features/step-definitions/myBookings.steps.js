const { Given, When, Then } = require('@wdio/cucumber-framework')
const { browser, expect } = require('@wdio/globals')

const MyBookingsPage = require('../pageobjects/myBookings.page')
const RoomDetailPage = require('../pageobjects/roomDetail.page')
const ModifyModal = require('../pageobjects/components/modifyModal')
const { isoFromToday, addDaysToIso, toDisplayDate, formatBs } = require('../support/formatters')
const { logToConsole, attachJson } = require('../support/inspector')
const {
    DB_KEY, myReservations, storedReservation, upcomingReservationOf, bookRoom, expectConfirmation
} = require('../support/bookings')

// La reserva se identifica por el código que mostró la confirmación (this.booking.code)

const nightsLabel = (nights) => `${nights} ${nights === 1 ? 'noche' : 'noches'}`
const datesLabel = ({ checkIn, checkOut }) => `${toDisplayDate(checkIn)} → ${toDisplayDate(checkOut)}`
const BUTTONS = { 'Modificar fechas': (code) => MyBookingsPage.btnModify(code), 'Cancelar': (code) => MyBookingsPage.btnCancel(code) }

// Estado que debería mostrar Mis reservas para una reserva guardada
function expectedStatus (reservation) {
    const today = isoFromToday(0)
    if (reservation.cancelledAt) return 'Cancelada'
    if (reservation.noShow) return 'No presentado'
    if (today < reservation.checkIn) return 'Confirmada'
    if (today < reservation.checkOut) return 'En curso'
    return 'Finalizada'
}

// Reservas sembradas, según su situación (se buscan por estado, no por un código fijo)
const SEEDED = {
    'finalizada': (r, today) => !r.cancelledAt && !r.noShow && r.checkOut <= today,
    'en curso': (r, today) => !r.cancelledAt && !r.noShow && r.checkIn <= today && today < r.checkOut,
    'no presentada': (r) => r.noShow,
    'cancelada': (r) => !!r.cancelledAt,
    'con check-in mañana': (r, _today, tomorrow) => !r.cancelledAt && !r.noShow && r.checkIn === tomorrow
}

async function updateStored (world, change) {
    await browser.execute((dbKey, id, fields) => {
        const db = JSON.parse(localStorage.getItem(dbKey))
        Object.assign(db.reservations.find((r) => r.id === id), fields)
        localStorage.setItem(dbKey, JSON.stringify(db))
    }, DB_KEY, world.booking.code, change)
    await logToConsole(`localStorage: reserva ${world.booking.code} editada`, change)
}

// ---------- Mis reservas ----------

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

Then('no debería tener reservas en Mis reservas', async () => {
    await expect(MyBookingsPage.emptyMessage).toHaveText('No hay reservas para mostrar.')
    await expect(MyBookingsPage.rows).toBeElementsArrayOfSize(0)
})

// La reserva del usuario nuevo se identifica por el código de su confirmación
Then('no debería ver la reserva del usuario nuevo en Mis reservas', async function () {
    await expect(MyBookingsPage.activeSummary).toBeDisplayed()
    await attachJson('Reservas visibles', await MyBookingsPage.rows.map((row) => row.getText()))
    await expect(MyBookingsPage.row(this.booking.code)).not.toBeExisting()
})

Given('que tengo la reserva sembrada {string}', async function (situation) {
    const found = (await myReservations()).find((r) => SEEDED[situation](r, isoFromToday(0), isoFromToday(1)))
    await attachJson(`Reserva sembrada ${situation}`, found)
    this.booking = { code: found.id, room: found.roomId, checkIn: found.checkIn, checkOut: found.checkOut }
    this.storedBefore = found
})

Then('la tabla de Mis reservas debería tener las columnas {string}', async (columns) => {
    await expect(MyBookingsPage.title).toHaveText('Mis reservas')
    // El CSS los muestra en mayúsculas: se compara el texto del encabezado, no su estilo
    const shown = await MyBookingsPage.headers.map((th) => th.getProperty('textContent'))
    expect(shown).toEqual(columns.split(', '))
})

Then('el filtro {string} debería estar activo', async (label) => {
    await expect(MyBookingsPage.activeFilter).toHaveText(label)
    await expect(MyBookingsPage.filter(label)).toHaveAttribute('aria-pressed', 'true')
})

Then('la reserva creada debería figurar primera en Mis reservas', async function () {
    await expect(MyBookingsPage.row(this.booking.code)).toBeDisplayed()
    expect((await MyBookingsPage.visibleReservations())[0].code).toBe(this.booking.code)
})

Then('las reservas deberían estar ordenadas de la más nueva a la más antigua', async () => {
    const codes = (await MyBookingsPage.visibleReservations()).map((r) => r.code)
    await attachJson('Orden de las reservas', codes)
    expect(codes).toEqual([...codes].sort().reverse())
})

// Antes de filtrar se guarda la tabla completa (filtro "Todas") para comparar
When('filtro Mis reservas por {string}', async function (label) {
    await expect(MyBookingsPage.activeSummary).toBeDisplayed()
    this.allReservations = await MyBookingsPage.visibleReservations()
    await MyBookingsPage.filterBy(label)
})

Then('deberían verse solo las reservas en estado {string}', async function (status) {
    const expected = this.allReservations.filter((r) => r.status === status).map((r) => r.code)
    await attachJson('Tabla completa y reservas esperadas', { todas: this.allReservations, esperadas: expected })
    if (expected.length === 0) {
        await expect(MyBookingsPage.emptyMessage).toHaveText('No hay reservas para mostrar.')
    }
    await expect(MyBookingsPage.rows).toBeElementsArrayOfSize(expected.length)
    expect((await MyBookingsPage.visibleReservations()).map((r) => r.code)).toEqual(expected)
})

Then('el resumen de reservas activas debería coincidir con las reservas confirmadas y en curso de la tabla', async () => {
    await expect(MyBookingsPage.activeSummary).toBeDisplayed()
    const statuses = await MyBookingsPage.statusCells.map((cell) => cell.getText())
    const active = statuses.filter((s) => s === 'Confirmada' || s === 'En curso').length
    await attachJson('Estados de la tabla', { estados: statuses, activas: active, resumen: await MyBookingsPage.activeSummary.getText() })
    await expect(MyBookingsPage.activeCount).toHaveText(String(active))
})

Then('el límite de reservas activas debería ser {int}', async (limit) => {
    await expect(MyBookingsPage.reservationLimit).toHaveText(String(limit))
})

When('guardo el resumen de reservas activas', async function () {
    this.activeBefore = Number(await MyBookingsPage.activeCount.getText())
})

Then('el resumen de reservas activas no debería cambiar', async function () {
    await expect(MyBookingsPage.activeCount).toHaveText(String(this.activeBefore))
})

Then('las reservas activas deberían bajar en {int}', async function (count) {
    await expect(MyBookingsPage.activeCount).toHaveText(String(this.activeBefore - count))
})

// Estados: "habilitado", "deshabilitado" o "ausente" (la fila no muestra el botón)
Then('el botón {string} de la reserva debería estar {string}', async function (button, state) {
    const element = BUTTONS[button](this.booking.code)
    await expect(MyBookingsPage.row(this.booking.code)).toBeDisplayed()
    if (state === 'habilitado') await expect(element).toBeEnabled()
    else if (state === 'deshabilitado') await expect(element).toBeDisabled()
    else await expect(element).not.toBeExisting()
})

// El motivo por el que una acción no está disponible se muestra como title del botón
Then('el botón {string} de la reserva debería indicar {string}', async function (button, reason) {
    const element = BUTTONS[button](this.booking.code)
    if (!reason && !(await element.isExisting())) return
    expect((await element.getAttribute('title')) || '').toBe(reason)
})

Then('la reserva no debería tener acciones', async function () {
    await expect(MyBookingsPage.row(this.booking.code)).toBeDisplayed()
    await expect(MyBookingsPage.rowButtons(this.booking.code)).toBeElementsArrayOfSize(0)
})

Then('debería ver el error de Mis reservas {string}', async (message) => {
    await expect(MyBookingsPage.error).toHaveText(message)
})

// La app responde ~1 s después de la acción: se espera ese tiempo a que aparezca
// un error antes de afirmar que no hay ninguno
Then('no debería ver errores en Mis reservas', async () => {
    const appeared = await browser.waitUntil(() => MyBookingsPage.error.isDisplayed(), { timeout: 2000 }).catch(() => false)
    if (appeared) await attachJson('Error mostrado', await MyBookingsPage.error.getText())
    await expect(MyBookingsPage.error).not.toBeDisplayed()
})

Then('la fila de la reserva debería mostrar lo guardado por la aplicación', async function () {
    const stored = await storedReservation(this.booking.code)
    const code = this.booking.code
    await attachJson('Fila en pantalla / reserva guardada', { fila: await MyBookingsPage.row(code).getText(), guardada: stored })
    await expect(MyBookingsPage.cell(code, 'status')).toHaveText(expectedStatus(stored))
    await expect(MyBookingsPage.cell(code, 'check-in')).toHaveText(toDisplayDate(stored.checkIn))
    await expect(MyBookingsPage.cell(code, 'check-out')).toHaveText(toDisplayDate(stored.checkOut))
    await expect(MyBookingsPage.cell(code, 'total')).toHaveText(formatBs(stored.total))
    await expect(MyBookingsPage.cell(code, 'modifications')).toHaveText(`${stored.modifications}/1`)
})

// ---------- Modificar fechas ----------

async function openModification (world) {
    world.storedBefore = await storedReservation(world.booking.code)
    await MyBookingsPage.openModify(world.booking.code)
}

function chooseNewDates (world, days, nights) {
    const checkIn = isoFromToday(days)
    world.newDates = { checkIn, checkOut: addDaysToIso(checkIn, nights), nights }
    return world.newDates
}

async function expectModified (world) {
    const { code } = world.booking
    await expect(MyBookingsPage.toast).toHaveText(`Reserva ${code} modificada: ${datesLabel(world.newDates)}.`)
    world.previousBooking = { ...world.booking }
    world.booking = { ...world.booking, ...world.newDates }
    await attachJson('Reserva modificada', { antes: world.previousBooking, despues: await storedReservation(code) })
}

// Modificación completa desde Mis reservas con "Elegir nuevas fechas"
async function modifyFromMyBookings (world, nights, days) {
    world.storedBefore = await storedReservation(world.booking.code)
    const { checkIn, checkOut } = chooseNewDates(world, days, nights)
    await MyBookingsPage.modifyDates(world.booking.code, checkIn, checkOut)
}

When('abro la modificación de fechas de la reserva', async function () {
    await openModification(this)
})

When('elijo la opción {string}', async (option) => {
    await ModifyModal.chooseOption(option)
})

When('elijo nuevas fechas con check-in dentro de {int} días por {int} noche(s)', async function (days, nights) {
    const { checkIn, checkOut } = chooseNewDates(this, days, nights)
    await ModifyModal.chooseNewDates(checkIn, checkOut)
})

When('mantengo las noches y elijo el check-in dentro de {int} días', async function (days) {
    const { checkIn } = chooseNewDates(this, days, this.booking.nights)
    await ModifyModal.keepNights(checkIn)
})

When('elijo en el calendario de modificación el check-in dentro de {int} días', async function (days) {
    await ModifyModal.calendar.selectDay(isoFromToday(days))
})

When('guardo los cambios de la modificación', async () => {
    await ModifyModal.save()
})

When('cierro el formulario de modificación con {string}', async (option) => {
    if (option === 'Cancelar') await ModifyModal.close()
    else if (option === 'Escape') await browser.keys('Escape')
    else throw new Error(`Opción no soportada: ${option}`)
})

When('modifico la reserva a {int} noche(s) con check-in dentro de {int} días', async function (nights, days) {
    await modifyFromMyBookings(this, nights, days)
    await expectModified(this)
})

Given('modifiqué la reserva a {int} noche(s) con check-in dentro de {int} días', async function (nights, days) {
    await modifyFromMyBookings(this, nights, days)
    await expectModified(this)
})

// Sin verificar el resultado: se espera la respuesta de la app (confirmación o error)
When('intento modificar la reserva a {int} noche(s) con check-in dentro de {int} días', async function (nights, days) {
    await modifyFromMyBookings(this, nights, days)
    await browser.waitUntil(async () => (await MyBookingsPage.toast.isDisplayed()) || (await ModifyModal.error.isDisplayed()),
        { timeoutMsg: 'La aplicación no respondió al guardar la modificación' })
})

Then('debería ver la confirmación de la modificación', async function () {
    await expectModified(this)
})

Then('el formulario de modificación debería cerrarse', async () => {
    await expect(ModifyModal.modal).not.toBeExisting()
})

Then('debería ver el error de la modificación {string}', async (message) => {
    await expect(ModifyModal.error).toHaveText(message)
})

Then('el botón Guardar cambios debería estar {string}', async (state) => {
    if (state === 'habilitado') await expect(ModifyModal.btnSave).toBeEnabled()
    else await expect(ModifyModal.btnSave).toBeDisabled()
})

Then('la modificación debería mostrar la reserva, su habitación y sus fechas actuales', async function () {
    const { code, room, nights } = this.booking
    await expect(ModifyModal.subtitle).toHaveText(`${code} · Habitación ${room}`)
    await expect(ModifyModal.currentDates).toHaveText(datesLabel(this.booking))
    await expect(ModifyModal.currentNights).toHaveText(nightsLabel(nights))
})

Then('la modificación debería ofrecer {string} y {string}', async (first, second) => {
    expect(await ModifyModal.optionLabels.map((label) => label.getText())).toEqual([first, second])
})

Then('la modificación debería indicar check-in entre mañana y dentro de {int} días', async (maxDays) => {
    await expect(ModifyModal.dateRange).toHaveText(`Check-in entre ${toDisplayDate(isoFromToday(1))} y ${toDisplayDate(isoFromToday(maxDays))}`)
})

Then('la modificación debería indicar check-in entre mañana y dentro de {int} días, de {int} a {int} noches', async (maxDays, minNights, maxNights) => {
    await expect(ModifyModal.dateRange).toHaveText(
        `Check-in entre ${toDisplayDate(isoFromToday(1))} y ${toDisplayDate(isoFromToday(maxDays))} · de ${minNights} a ${maxNights} noches`)
})

Then('la modificación debería avisar {string}', async (notice) => {
    await expect(ModifyModal.modal).toHaveText(expect.stringContaining(notice))
})

Then('la modificación debería mostrar {int} noche(s) y un nuevo total de {string}', async function (nights, total) {
    await expect(ModifyModal.newDates).toHaveText(datesLabel(this.newDates))
    await expect(ModifyModal.newNights).toHaveText(nightsLabel(nights))
    await expect(ModifyModal.newTotal).toHaveText(total)
})

Then('el calendario de modificación debería pedir el check-out para un check-in dentro de {int} días', async (days) => {
    await expect(ModifyModal.calendar.hint).toHaveText(
        `Check-in ${toDisplayDate(isoFromToday(days))}. Elija el check-out (máx. 14 noches).`)
})

Then('el día dentro de {int} días debería estar {string} en el calendario de modificación', async (days, state) => {
    expect(await ModifyModal.calendar.isDayEnabled(isoFromToday(days))).toBe(state === 'habilitado')
})

async function expectNightsDisabled ({ checkIn, checkOut }) {
    for (let day = checkIn; day < checkOut; day = addDaysToIso(day, 1)) {
        expect(await ModifyModal.calendar.isDayEnabled(day)).toBe(false)
    }
}

// La otra reserva es la creada antes que la actual en el mismo escenario
Then('las noches de mi otra reserva deberían estar deshabilitadas en el calendario de modificación', async function () {
    await expectNightsDisabled(this.bookings[this.bookings.length - 2])
})

Then('las noches reservadas por {string} deberían estar deshabilitadas en el calendario de modificación', async function (_username) {
    await expectNightsDisabled(this.otherReservation)
})

Then('el foco debería estar dentro del formulario de modificación', async () => {
    await logToConsole('document.activeElement', await browser.execute(() => document.activeElement.outerHTML.slice(0, 200)))
    expect(await browser.execute(() => !!document.activeElement.closest('#modify-modal'))).toBe(true)
})

// ---------- Cancelar ----------

When('cancelo la reserva desde Mis reservas', async function () {
    this.storedBefore = await storedReservation(this.booking.code)
    await MyBookingsPage.openCancel(this.booking.code)
})

When('confirmo la cancelación', async () => {
    await MyBookingsPage.btnConfirmCancel.click()
})

When('confirmo la cancelación con doble clic', async () => {
    await MyBookingsPage.btnConfirmCancel.doubleClick()
})

When('desisto de la cancelación con {string}', async (option) => {
    if (option === 'No, volver') await MyBookingsPage.btnKeepBooking.click()
    else if (option === 'Escape') await browser.keys('Escape')
    else throw new Error(`Opción no soportada: ${option}`)
})

Given('cancelé la reserva desde Mis reservas', async function () {
    await MyBookingsPage.cancelBooking(this.booking.code)
    await expect(MyBookingsPage.toast).toHaveText(`Reserva ${this.booking.code} cancelada.`)
})

Then('el diálogo de cancelación debería pedir confirmar la reserva', async function () {
    const { code, room } = this.booking
    await expect(MyBookingsPage.cancelDialogTitle).toHaveText('Cancelar reserva')
    await expect(MyBookingsPage.cancelDialogMessage).toHaveText(
        `¿Confirma la cancelación de la reserva ${code} (habitación ${room}, ${datesLabel(this.booking)})?`)
})

Then('el foco debería estar en el botón "No, volver"', async () => {
    await expect(MyBookingsPage.btnKeepBooking).toBeFocused()
})

Then('el diálogo de cancelación debería cerrarse', async () => {
    await expect(MyBookingsPage.cancelDialog).not.toBeExisting()
})

Then('debería ver la confirmación de la cancelación', async function () {
    await expect(MyBookingsPage.toast).toHaveText(`Reserva ${this.booking.code} cancelada.`)
    await attachJson('Reserva cancelada', await storedReservation(this.booking.code))
})

Then('no debería ver la confirmación de la cancelación', async function () {
    if (await MyBookingsPage.toast.isDisplayed()) {
        await expect(MyBookingsPage.toast).not.toHaveText(`Reserva ${this.booking.code} cancelada.`)
    }
})

// ---------- Reservas propias y de otros usuarios ----------

Given('reservé por {int} noche(s) con check-in dentro de {int} días la habitación reservada por {string}', async function (nights, days, username) {
    this.otherReservation = await upcomingReservationOf(username)
    this.foreignReservation = this.otherReservation
    await attachJson(`Reserva activa de ${username}`, this.otherReservation)
    await bookRoom(this, this.otherReservation.roomId, nights, days)
    await expectConfirmation(this)
})

Then('se puede reservar la habitación {string} por {int} noche(s) con check-in dentro de {int} días', async function (room, nights, days) {
    await bookRoom(this, room, nights, days)
    await expectConfirmation(this)
})

When('abro el detalle de la habitación de la reserva', async function () {
    await RoomDetailPage.open(this.booking.room)
    await expect(RoomDetailPage.title).toHaveText(`Habitación ${this.booking.room}`)
})

async function expectNotBooked (booking) {
    if (await RoomDetailPage.bookedDates.isExisting()) {
        await attachJson('Fechas ocupadas del detalle', await RoomDetailPage.bookedDates.getText())
        await expect(RoomDetailPage.bookedDates).not.toHaveText(expect.stringContaining(datesLabel(booking)))
    }
}

Then('las fechas anteriores de la reserva no deberían figurar como ocupadas en el detalle', async function () {
    await expectNotBooked(this.previousBooking)
})

Then('las fechas de la reserva no deberían figurar como ocupadas en el detalle', async function () {
    await expectNotBooked(this.booking)
})

// ---------- Reglas validadas por la lógica de la aplicación ----------
// Se envían a window.__hotelApi (la misma lógica que usa Mis reservas) datos
// que la interfaz no permite elegir.

async function requestModification (world, data) {
    const { code } = world.booking
    world.storedBefore = await storedReservation(code)
    world.apiResult = await browser.execute((id, payload) => window.__hotelApi.modifyReservation(id, payload), code, data)
    await attachJson('Modificación enviada a la aplicación', { reserva: code, ...data })
    await logToConsole(`window.__hotelApi.modifyReservation('${code}', ...)`, world.apiResult)
}

When('solicito a la aplicación modificar la reserva con check-in dentro de {int} días por {int} noche(s)', async function (days, nights) {
    const checkIn = isoFromToday(days)
    await requestModification(this, { checkIn, checkOut: addDaysToIso(checkIn, nights) })
})

When('solicito a la aplicación modificar la reserva a las fechas reservadas por {string}', async function (_username) {
    const { checkIn, checkOut } = this.otherReservation
    await requestModification(this, { checkIn, checkOut })
})

When('solicito a la aplicación modificar la reserva a {int} noches con check-in dentro de {int} días indicando total {int}, tarifa {int}, modificaciones {int} y el usuario {string}',
    async function (nights, days, total, rate, modifications, username) {
        const checkIn = isoFromToday(days)
        const userId = await browser.execute((dbKey, name) =>
            JSON.parse(localStorage.getItem(dbKey)).users.find((u) => u.username === name).id, DB_KEY, username)
        await requestModification(this, { checkIn, checkOut: addDaysToIso(checkIn, nights), total, rate, modifications, userId })
    })

When('solicito a la aplicación cancelar la reserva', async function () {
    const { code } = this.booking
    this.storedBefore = await storedReservation(code)
    this.apiResult = await browser.execute((id) => window.__hotelApi.cancelReservation(id), code)
    await logToConsole(`window.__hotelApi.cancelReservation('${code}')`, this.apiResult)
})

Then('la aplicación debería rechazar la modificación', async function () {
    await attachJson('Respuesta de la aplicación', this.apiResult)
    expect(this.apiResult.ok).toBe(false)
})

// "aceptada" o el mensaje de error esperado
Then('la aplicación debería responder {string}', async function (expected) {
    await attachJson('Respuesta de la aplicación', this.apiResult)
    if (expected === 'aceptada') {
        expect(this.apiResult.ok).toBe(true)
    } else {
        expect(this.apiResult.ok).toBe(false)
        expect(this.apiResult.message).toBe(expected)
    }
})

Then('la reserva guardada no debería cambiar', async function () {
    const current = await storedReservation(this.booking.code)
    await attachJson('Reserva guardada antes / después', { antes: this.storedBefore, despues: current })
    expect(current).toEqual(this.storedBefore)
})

Then('la reserva guardada debería tener {int} noches, total {string}, modificaciones {int} y pertenecer al usuario {string}',
    async function (nights, total, modifications, username) {
        const saved = await storedReservation(this.booking.code)
        const owner = await browser.execute((dbKey, name) =>
            JSON.parse(localStorage.getItem(dbKey)).users.find((u) => u.username === name).id, DB_KEY, username)
        await attachJson('Reserva guardada', saved)
        expect(this.apiResult.ok).toBe(true)
        expect(saved.checkOut).toBe(addDaysToIso(saved.checkIn, nights))
        expect(formatBs(saved.total)).toBe(total)
        expect(saved.modifications).toBe(modifications)
        expect(saved.userId).toBe(owner)
    })

Then('el total guardado de la reserva debería ser {string}', async function (total) {
    const saved = await storedReservation(this.booking.code)
    await attachJson('Reserva guardada', saved)
    expect(formatBs(saved.total)).toBe(total)
})

Then('la reserva guardada debería estar cancelada', async function () {
    const saved = await storedReservation(this.booking.code)
    await attachJson('Reserva guardada', saved)
    expect(saved.cancelledAt).toBe(isoFromToday(0))
})

Then('la reserva guardada no debería estar cancelada', async function () {
    const saved = await storedReservation(this.booking.code)
    await attachJson('Reserva guardada', saved)
    expect(saved.cancelledAt).toBeNull()
})

// ---------- Datos editados en el almacenamiento ----------
// La app guarda las reservas en localStorage: cualquier usuario puede editarlas
// desde DevTools. Se verifica que las reglas no dependan de esos datos.

When('edito en el almacenamiento el contador de modificaciones de la reserva a {int}', async function (modifications) {
    await updateStored(this, { modifications })
})

When('edito en el almacenamiento el total de la reserva a {int}', async function (total) {
    await updateStored(this, { total })
})

When('edito en el almacenamiento la reserva para que figure a nombre de {string}', async function (username) {
    const userId = await browser.execute((dbKey, name) =>
        JSON.parse(localStorage.getItem(dbKey)).users.find((u) => u.username === name).id, DB_KEY, username)
    await updateStored(this, { userId })
})
