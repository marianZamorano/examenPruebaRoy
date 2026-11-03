const Page = require('./page')

/**
* Página de inicio de sesión (/login)
*/
class LoginPage extends Page {
    // TODO: getters de selectores (usuario, contraseña, botón Ingresar, mensaje de error)

    async login (username, password) {
        // TODO
    }

    open () {
        return super.open('login')
    }
}

module.exports = new LoginPage()
