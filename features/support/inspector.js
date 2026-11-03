const { browser } = require('@wdio/globals')
const { addAttachment } = require('@wdio/allure-reporter')
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
* Utilidades para inspeccionar el navegador desde las pruebas (lo mismo que se
* revisaría en DevTools: almacenamiento, caché, consola) y adjuntarlo a Allure.
*
* En modo evidencias (wdio.devtools.conf.js) Chrome se abre con DevTools y cada
* paso se captura con la ventana completa (página + DevTools). Las capturas se
* adjuntan a Allure y se guardan en docs/evidencias/<ID del defecto>/pasos/.
*/
const DEVTOOLS_MODE = process.env.DEVTOOLS_EVIDENCE === '1'
const DEVTOOLS_PROFILE_MARKER = 'hotel-qa-devtools-profile'
const EVIDENCE_DIR = path.join(__dirname, '..', '..', 'docs', 'evidencias')
const CAPTURE_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'capture-window.ps1')

let currentScenario = null
let stepNumber = 0

function setCurrentScenario (pickle) {
    currentScenario = pickle
    stepNumber = 0
}

function getCurrentScenario () {
    return currentScenario
}

// ID del defecto según el tag @issue del escenario (ej. BUG-001)
function issueId (pickle = currentScenario) {
    const issueTag = pickle?.tags.map((t) => t.name).find((name) => name.startsWith('@issue='))
    return issueTag ? issueTag.split('=')[1] : null
}

// Carpeta de evidencia del escenario: docs/evidencias/<ID>/. Si el escenario es
// un ejemplo de un Scenario Outline, cada ejemplo tiene su subcarpeta (por el
// texto entre paréntesis del nombre) para que no se pisen las capturas.
function evidenceDir (pickle = currentScenario) {
    const id = issueId(pickle)
    if (!id) return null
    const example = pickle.astNodeIds.length > 1 && pickle.name.match(/\(([^()]+)\)\s*$/)
    return example ? path.join(EVIDENCE_DIR, id, slug(example[1])) : path.join(EVIDENCE_DIR, id)
}

function slug (text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 60)
}

async function readBrowserStorage () {
    return browser.execute(async () => ({
        localStorage: Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])),
        sessionStorage: Object.fromEntries(Object.keys(sessionStorage).map((k) => [k, sessionStorage.getItem(k)])),
        cookies: document.cookie,
        cacheStorage: 'caches' in window ? await caches.keys() : [],
        serviceWorkers: navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0,
        indexedDB: indexedDB.databases ? (await indexedDB.databases()).map((db) => db.name) : []
    }))
}

// Estado del navegador en un momento dado: sirve para entender un fallo sin
// tener que volver a ejecutar la prueba ni agregar código
async function collectDiagnostics () {
    const page = await browser.execute(() => ({
        ruta: location.pathname,
        sesionEnAlmacenamiento: localStorage.getItem('hotel-qa:session'),
        usuarioEnCabecera: document.querySelector('#current-user')?.textContent || null,
        titulo: document.querySelector('main h1')?.textContent || null
    })).catch((e) => ({ error: e.message }))
    return {
        url: await browser.getUrl().catch(() => null),
        pestanaActiva: await browser.getWindowHandle().catch(() => null),
        ventanasAbiertas: (await browser.getWindowHandles().catch(() => [])).length,
        ...page
    }
}

// Escribe en la consola del navegador el comando inspeccionado y su resultado
async function logToConsole (label, value) {
    await browser.execute((label, value) => {
        console.log('%c> ' + label, 'color:#1a73e8;font-weight:bold')
        if (value && typeof value === 'object') console.table(value)
        else console.log(value)
    }, label, value)
}

async function attachJson (name, data) {
    await addAttachment(name, JSON.stringify(data, null, 2), 'application/json')
}

/**
* Captura del paso actual, adjunta a Allure con el nombre del paso.
* - Modo normal: captura de la página (WebdriverIO).
* - Modo evidencias: ventana completa con DevTools, guardada también en
*   docs/evidencias/<ID>/pasos/ cuando el escenario tiene un tag @issue.
*/
async function captureStep (stepText, passed) {
    stepNumber += 1
    const label = `${String(stepNumber).padStart(2, '0')} ${passed ? '' : '(FALLO) '}${stepText}`

    if (!DEVTOOLS_MODE) {
        await addAttachment(`Paso ${label}`, Buffer.from(await browser.takeScreenshot(), 'base64'), 'image/png')
        return
    }

    await browser.pause(400)
    const scenarioDir = evidenceDir()
    const dir = scenarioDir ? path.join(scenarioDir, 'pasos') : fs.mkdtempSync(path.join(require('os').tmpdir(), 'paso-'))
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${String(stepNumber).padStart(2, '0')}_${passed ? '' : 'FALLO_'}${slug(stepText)}.jpg`)
    execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', CAPTURE_SCRIPT,
        '-Marker', DEVTOOLS_PROFILE_MARKER, '-Out', file])
    await addAttachment(`Paso ${label} (con DevTools)`, fs.readFileSync(file), 'image/jpeg')
}

module.exports = {
    DEVTOOLS_MODE,
    DEVTOOLS_PROFILE_MARKER,
    EVIDENCE_DIR,
    setCurrentScenario,
    getCurrentScenario,
    issueId,
    evidenceDir,
    collectDiagnostics,
    readBrowserStorage,
    logToConsole,
    attachJson,
    captureStep
}
