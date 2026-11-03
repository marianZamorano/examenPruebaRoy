const Page = require('./page')

/**
* Página de registro de usuario (/registro)
*/
class RegisterPage extends Page {
    // TODO: getters de selectores del formulario de registro

    async register (user) {
        // TODO
    }

    open () {
        return super.open('registro')
    }
}

module.exports = new RegisterPage()
