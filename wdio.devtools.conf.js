const fs = require('fs')
const os = require('os')
const path = require('path')
const video = require('wdio-video-reporter').default
const { config: baseConfig } = require('./wdio.conf')

/**
* Configuración de evidencias: ejecuta los escenarios @bug con Chrome y DevTools
* abiertos (pestaña Console). Cada paso se captura con la ventana completa
* (página + DevTools) y cada escenario fallido se graba en video. Todo se adjunta
* a Allure y se guarda en docs/evidencias/<ID del defecto>/.
*
* Al terminar se genera automáticamente el índice docs/evidencias/README.md.
* La captura de la ventana usa scripts/capture-window.ps1 (Windows).
*/
process.env.DEVTOOLS_EVIDENCE = '1'

const PROFILE_DIR = path.join(os.tmpdir(), 'hotel-qa-devtools-profile')
const EVIDENCE_DIR = path.join(__dirname, 'docs', 'evidencias')
const VIDEO_TMP_DIR = path.join(__dirname, 'videos', 'evidencias')

// Preferencias de DevTools: abrir en Console, acoplado a la derecha y sin avisos
const DEVTOOLS_PREFERENCES = {
    credentials_enable_service: false,
    profile: { password_manager_enabled: false },
    devtools: {
        preferences: {
            inspectorVersion: '47',
            'panel-selected-tab': '"console"',
            'current-dock-state': '"right"',
            'inspector-view.split-view-state': '{"vertical":{"size":760}}',
            'disable-locale-info-bar': 'true'
        }
    }
}

// Solo letras y números ASCII: así se compara el nombre del escenario con el nombre
// del archivo de video (el reporter de video elimina tildes, ñ y caracteres especiales)
const normalize = (text) => text.replace(/[^A-Za-z0-9]/g, '').toLowerCase()

// Carpetas de evidencia con resultado.json, a cualquier profundidad: <ID>,
// <ID>/<ejemplo>, <ID>/<escenario> o <ID>/<escenario>/<ejemplo> (rutas relativas)
function evidenceFolders (dir = EVIDENCE_DIR, prefix = '') {
    const folders = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'pasos').map((d) => d.name).sort()) {
        const relative = prefix ? `${prefix}/${entry}` : entry
        if (fs.existsSync(path.join(dir, entry, 'resultado.json'))) folders.push(relative)
        folders.push(...evidenceFolders(path.join(dir, entry), relative))
    }
    return folders
}

// Mueve cada video a la carpeta de su escenario como video.webm. Se compara con el
// nombre original del escenario (resultado.json), normalizado igual que el video:
// el nombre de la carpeta no sirve porque convierte las tildes ("Atras") y el
// reporter de video las elimina ("Atrs")
function organizeVideos () {
    if (!fs.existsSync(VIDEO_TMP_DIR)) return
    const folders = evidenceFolders().map((folder) => ({
        dir: path.join(EVIDENCE_DIR, folder),
        name: normalize(JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, folder, 'resultado.json'), 'utf8')).escenario)
    }))
    for (const file of fs.readdirSync(VIDEO_TMP_DIR).filter((f) => f.endsWith('.webm'))) {
        const videoName = normalize(file.split(/-\d+-\d+--/)[0])
        const target = folders.find((f) => f.name === videoName)
        if (target) fs.copyFileSync(path.join(VIDEO_TMP_DIR, file), path.join(target.dir, 'video.webm'))
    }
}

// Índice de la última ejecución, generado a partir de los resultados reales
function writeIndex () {
    const rows = evidenceFolders().map((folder) => {
        const dir = path.join(EVIDENCE_DIR, folder)
        const r = JSON.parse(fs.readFileSync(path.join(dir, 'resultado.json'), 'utf8'))
        const pasosDir = path.join(dir, 'pasos')
        const pasos = fs.existsSync(pasosDir) ? fs.readdirSync(pasosDir).sort() : []
        const fallo = pasos.find((p) => p.includes('FALLO_'))
        const estado = r.estado === 'FAILED' ? 'Reproducido' : r.estado === 'PASSED' ? 'No reproducido (¿corregido?)' : r.estado
        const videoLink = fs.existsSync(path.join(dir, 'video.webm')) ? `[video](${folder}/video.webm)` : '—'
        const falloLink = fallo ? `[captura del fallo](${folder}/pasos/${fallo})` : '—'
        return `| ${r.id} | ${r.escenario} | ${estado} | ${pasos.length} | ${falloLink} | ${videoLink} |`
    })
    const fecha = new Date().toLocaleString('es-BO', { dateStyle: 'full', timeStyle: 'short' })
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'README.md'), [
        '# Evidencias de la última ejecución',
        '',
        '> Archivo generado automáticamente por `npm run test:evidencias`. No editar a mano.',
        '',
        `**Fecha de ejecución:** ${fecha}`,
        '',
        'Cada carpeta contiene la captura con DevTools de cada paso (`pasos/`), el video del escenario',
        '(`video.webm`) y el resultado (`resultado.json`). Si varios escenarios reproducen el mismo',
        'defecto, o el escenario tiene varios ejemplos (Scenario Outline), cada uno tiene su propia',
        'subcarpeta. El historial de ejecuciones anteriores está en el reporte de Allure',
        '(`npm run report`, gráficos *Trend* y pestaña *History*).',
        '',
        '| ID | Escenario | Resultado | Pasos capturados | Fallo | Video |',
        '|---|---|---|---|---|---|',
        ...rows,
        ''
    ].join('\n'))
}

exports.config = {
    ...baseConfig,
    capabilities: [{
        browserName: 'chrome',
        'wdio:enforceWebDriverClassic': true,
        'goog:chromeOptions': {
            excludeSwitches: ['enable-automation'],
            args: [
                `--user-data-dir=${PROFILE_DIR}`,
                '--auto-open-devtools-for-tabs',
                '--window-size=1800,950',
                '--window-position=0,0',
                '--lang=es'
            ]
        }
    }],
    cucumberOpts: { ...baseConfig.cucumberOpts, tags: '@bug' },
    reporters: [
        'spec',
        ['allure', { outputDir: 'allure-results', useCucumberStepReporter: true, disableWebdriverStepsReporting: true, disableWebdriverScreenshotsReporting: true }],
        [video, { outputDir: 'videos/evidencias', saveAllVideos: false, videoSlowdownMultiplier: 3 }]
    ],

    onPrepare: function () {
        // La evidencia refleja solo la última ejecución: si un defecto se corrige,
        // su captura y su video no deben quedar en la carpeta. El historial de
        // ejecuciones queda en Allure (allure-history/) y en git.
        fs.rmSync(EVIDENCE_DIR, { recursive: true, force: true })
        fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
        fs.rmSync(VIDEO_TMP_DIR, { recursive: true, force: true })

        fs.rmSync(PROFILE_DIR, { recursive: true, force: true })
        fs.mkdirSync(path.join(PROFILE_DIR, 'Default'), { recursive: true })
        fs.writeFileSync(path.join(PROFILE_DIR, 'Default', 'Preferences'), JSON.stringify(DEVTOOLS_PREFERENCES))
    },

    onComplete: function () {
        organizeVideos()
        writeIndex()
    }
}
