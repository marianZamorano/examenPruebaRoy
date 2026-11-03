/**
* Datos únicos para registrar usuarios nuevos desde la interfaz. Cada escenario
* registra su propio usuario, así los escenarios no dependen entre sí ni de la
* fecha, y nunca chocan con los usuarios sembrados.
*/

let sequence = 0

// Sufijo alfanumérico único: marca de tiempo + secuencia + azar (base 36)
function uniqueSuffix () {
    sequence += 1
    return `${Date.now().toString(36)}${sequence.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
}

function newUserData (userType = 'Huésped') {
    const suffix = uniqueSuffix()
    return {
        fullName: 'Ana Prueba',
        email: `u${suffix}@correo.test`,
        username: `u${suffix}`.slice(0, 20),
        password: 'Clave123!',
        userType
    }
}

module.exports = { uniqueSuffix, newUserData }
