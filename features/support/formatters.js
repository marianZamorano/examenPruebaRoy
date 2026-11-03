/**
* Fechas relativas a hoy y montos con el formato que muestra la aplicación.
* Los escenarios nunca usan fechas fijas: siempre "dentro de N días".
*/

const pad = (n) => String(n).padStart(2, '0')

// Fecha ISO (aaaa-mm-dd) en hora local, igual que el atributo data-date del calendario
function toIso (date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function isoFromToday (days) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return toIso(date)
}

function addDaysToIso (iso, days) {
    const [y, m, d] = iso.split('-').map(Number)
    return toIso(new Date(y, m - 1, d + days))
}

// aaaa-mm-dd → dd/mm/aaaa
function toDisplayDate (iso) {
    return iso.split('-').reverse().join('/')
}

// 2100 → "Bs 2.100"
function formatBs (amount) {
    return `Bs ${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

// Mes de una fecha ISO como lo muestra el calendario: "Noviembre de 2026"
function monthLabel (iso) {
    const [y, m] = iso.split('-').map(Number)
    const label = new Date(y, m - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
}

module.exports = { isoFromToday, addDaysToIso, toDisplayDate, formatBs, monthLabel }
