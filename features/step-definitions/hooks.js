const { Before, After, AfterStep } = require('@wdio/cucumber-framework')
const { browser } = require('@wdio/globals')
const fs = require('fs')
const path = require('path')

const {
    DEVTOOLS_MODE, setCurrentScenario, issueId, evidenceDir,
    collectDiagnostics, attachJson, captureStep
} = require('../support/inspector')

// La app guarda sus datos en localStorage: se limpia antes de cada escenario
// para que los escenarios sean independientes entre sí.
Before(async (scenario) => {
    setCurrentScenario(scenario.pickle)
    await browser.url('/')
    await browser.execute(() => localStorage.clear())
})

// Captura de cada paso (para ver cómo se llega al defecto) y, si el paso falla,
// diagnóstico del estado del navegador: URL, sesión, usuario visible, pestañas
AfterStep(async ({ pickleStep, result }) => {
    const passed = result.status === 'PASSED'
    await captureStep(pickleStep.text, passed)
    if (!passed) {
        await attachJson('Diagnóstico del fallo', await collectDiagnostics())
    }
})

// En modo evidencias se registra el resultado de cada defecto para generar
// automáticamente el índice docs/evidencias/README.md
After(async ({ pickle, result }) => {
    const id = issueId(pickle)
    if (DEVTOOLS_MODE && id) {
        const dir = evidenceDir(pickle)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'resultado.json'), JSON.stringify({
            id,
            escenario: pickle.name,
            estado: result.status,
            mensaje: result.message ? result.message.split('\n').slice(0, 4).join('\n') : null,
            fecha: new Date().toISOString()
        }, null, 2))
    }
})

// Si un escenario abrió pestañas adicionales, se cierran para no afectar al siguiente.
// Solo se cierran las que abrió el escenario (con DevTools abierto, el navegador
// también lista sus ventanas y no deben cerrarse).
After(async function () {
    if (!this.tabs) return
    const [main, ...extra] = this.tabs
    for (const handle of extra) {
        await browser.switchToWindow(handle)
        await browser.closeWindow()
    }
    await browser.switchToWindow(main)
})
