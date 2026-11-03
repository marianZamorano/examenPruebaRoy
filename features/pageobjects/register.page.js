const { browser } = require('@wdio/globals')
const Page = require('./page')

// Nombre visible de cada campo → atributo name (también da el id de su mensaje de error)
const FIELDS = {
    'Nombre completo': 'fullName',
    'Correo': 'email',
    'Usuario': 'username',
    'Contraseña': 'password',
    'Confirmar contraseña': 'confirmPassword',
    'Tipo de usuario': 'userType',
    'Términos': 'acceptTerms'
}

/**
* Página de registro de usuario (/registro)
*/
class RegisterPage extends Page {
    get form () { return $('form[name="registerForm"]') }
    get title () { return $('form[name="registerForm"] h1') }
    get btnRegister () { return $('button[name="btnRegister"]') }
    get linkLogin () { return $('#link-login') }
    get formError () { return $('#register-error') }
    get selectUserType () { return $('select[name="userType"]') }

    field (label) { return $(`form[name="registerForm"] [name="${FIELDS[label]}"]`) }
    fieldError (label) { return $(`#${FIELDS[label]}-error`) }

    // Borra el campo con el teclado (como un usuario) para que la app registre el cambio
    async setField (label, value) {
        const input = this.field(label)
        if (label === 'Tipo de usuario') {
            await input.selectByAttribute('value', value)
        } else if (label === 'Términos') {
            if ((await input.isSelected()) !== value) await input.click()
        } else {
            await input.click()
            await browser.keys(['Control', 'a'])
            await browser.keys('Backspace')
            if (value) await input.addValue(value)
        }
    }

    async fillForm ({ fullName, email, username, password, confirmPassword = password, userType, acceptTerms = true }) {
        await this.setField('Nombre completo', fullName)
        await this.setField('Correo', email)
        await this.setField('Usuario', username)
        await this.setField('Contraseña', password)
        await this.setField('Confirmar contraseña', confirmPassword)
        await this.setField('Tipo de usuario', userType)
        await this.setField('Términos', acceptTerms)
    }

    async submit () {
        await this.btnRegister.click()
    }

    async register (user) {
        await this.fillForm(user)
        await this.submit()
    }

    // Simula manipular el formulario desde DevTools: agrega una opción que la app no ofrece
    async addUserTypeOption (value) {
        await browser.execute((v) => {
            const option = document.createElement('option')
            option.value = v
            option.text = v
            document.querySelector('select[name="userType"]').appendChild(option)
        }, value)
    }

    open () {
        return super.open('registro')
    }
}

module.exports = new RegisterPage()
