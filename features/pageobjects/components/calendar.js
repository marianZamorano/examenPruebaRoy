/**
* Calendario de selección de fechas. La aplicación usa el mismo componente en la
* búsqueda del listado (prefijo "search") y en el formulario de reserva
* (prefijo "reservation"); cambian solo los ids.
*/
class Calendar {
    constructor (prefix) {
        this.prefix = prefix
    }

    get container () { return $(`#${this.prefix}-calendar`) }
    get btnToggle () { return $(`#btn-open-${this.prefix}-calendar`) }
    get inputCheckIn () { return $(`#${this.prefix}-checkin`) }
    get month () { return $(`#${this.prefix}-calendar-month`) }
    get hint () { return $(`#${this.prefix}-calendar-hint`) }
    get btnPrevMonth () { return $(`#${this.prefix}-calendar-prev`) }
    get btnNextMonth () { return $(`#${this.prefix}-calendar-next`) }
    get days () { return $$(`#${this.prefix}-calendar .calendar__day`) }

    day (isoDate) { return $(`#${this.prefix}-calendar [data-date="${isoDate}"]`) }

    async open () {
        if (!(await this.container.isExisting())) await this.btnToggle.click()
    }

    // Navega por los meses hasta mostrar el día. Devuelve null si el calendario
    // no permite llegar a ese mes (fechas fuera del rango permitido).
    async showDay (isoDate) {
        await this.open()
        for (let i = 0; i < 12; i++) {
            if (await this.day(isoDate).isExisting()) return this.day(isoDate)
            const firstDay = await this.days[0].getAttribute('data-date')
            const nav = isoDate < firstDay ? this.btnPrevMonth : this.btnNextMonth
            if (!(await nav.isEnabled())) return null
            await nav.click()
        }
        return null
    }

    async isDayEnabled (isoDate) {
        const day = await this.showDay(isoDate)
        return day ? day.isEnabled() : false
    }

    async selectDay (isoDate) {
        const day = await this.showDay(isoDate)
        if (!day) throw new Error(`El calendario no muestra el día ${isoDate}`)
        await day.click()
    }

    async selectDates (checkIn, checkOut) {
        await this.selectDay(checkIn)
        await this.selectDay(checkOut)
    }

    async goToLastMonth () {
        await this.open()
        while (await this.btnNextMonth.isEnabled()) await this.btnNextMonth.click()
    }
}

module.exports = Calendar
