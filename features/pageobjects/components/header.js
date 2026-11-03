/**
* Cabecera de la aplicación (visible en todas las páginas cuando hay sesión).
* Es un componente (no una página), por eso no extiende de Page.
*/
class Header {
    get currentUser () { return $('#current-user') }
    get btnLogout () { return $('#btn-logout') }
    get navRooms () { return $('#nav-rooms') }
    get navReservations () { return $('#nav-reservations') }

    async logout () {
        await this.btnLogout.click()
    }
}

module.exports = new Header()
