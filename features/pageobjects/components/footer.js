/**
* Pie de página de la aplicación (visible en todas las páginas).
* Es un componente (no una página), por eso no extiende de Page.
*/
class Footer {
    get btnResetData () { return $('#btn-reset-data') }

    async resetData () {
        await this.btnResetData.click()
    }
}

module.exports = new Footer()
