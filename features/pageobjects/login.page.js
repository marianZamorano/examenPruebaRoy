const Page = require('./page')

/**
* Página de inicio de sesión (/login)
*/
class LoginPage extends Page {
    get inputUsername () { return $('#login-username') }
    get inputPassword () { return $('#login-password') }
    get btnSubmit () { return $('#btn-login') }
    get errorMessage () { return $('#login-error') }
    get linkRegister () { return $('#link-register') }

    async fillCredentials (username, password) {
        await this.inputUsername.setValue(username)
        await this.inputPassword.setValue(password)
    }

    async login (username, password) {
        await this.fillCredentials(username, password)
        await this.btnSubmit.click()
    }

    async loginWithEnter (username, password) {
        await this.fillCredentials(username, password)
        await browser.keys('Enter')
    }

    open () {
        return super.open('login')
    }
}

module.exports = new LoginPage()
