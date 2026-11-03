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

// Relación "nombre del escenario → ID del defecto" a partir de los tags @issue.
// En los Scenario Outline el nombre termina en "(<columna>)": se guarda el
// prefijo y el ejemplo se identifica por lo que sigue a ese prefijo.
function scenariosByIssue () {
    const exact = {}
    const outlines = []
    const featuresDir = path.join(__dirname, 'features')
    for (const file of fs.readdirSync(featuresDir).filter((f) => f.endsWith('.feature'))) {
        let pendingId = null
        for (const line of fs.readFileSync(path.join(featuresDir, file), 'utf8').split(/\r?\n/)) {
            const tag = line.match(/@issue=([\w-]+)/)
            if (tag) pendingId = tag[1]
            const scenario = line.match(/^\s*Scenario(?: Outline)?:\s*(.+)$/)
            if (scenario) {
                const outline = scenario[1].match(/^(.*)\(<[^>]+>\)\s*$/)
                if (pendingId && outline) outlines.push({ prefix: normalize(outline[1]), id: pendingId })
                else if (pendingId) exact[normalize(scenario[1])] = pendingId
                pendingId = null
            }
        }
    }
    return { exact, outlines }
}

// Carpeta de evidencia que corresponde a un video: docs/evidencias/<ID>/ o,
// para un ejemplo de Scenario Outline, docs/evidencias/<ID>/<ejemplo>/
function videoTarget ({ exact, outlines }, scenarioPart) {
    if (exact[scenarioPart]) return path.join(EVIDENCE_DIR, exact[scenarioPart])
    const outline = outlines.find((o) => scenarioPart.startsWith(o.prefix))
    if (!outline) return null
    const example = scenarioPart.slice(outline.prefix.length)
    const idDir = path.join(EVIDENCE_DIR, outline.id)
    const sub = fs.existsSync(idDir) && fs.readdirSync(idDir).find((d) => normalize(d) === example)
    return sub ? path.join(idDir, sub) : null
}

// Mueve cada video a la carpeta de su defecto (o de su ejemplo) como video.webm
function organizeVideos () {
    if (!fs.existsSync(VIDEO_TMP_DIR)) return
    const scenarios = scenariosByIssue()
    for (const file of fs.readdirSync(VIDEO_TMP_DIR).filter((f) => f.endsWith('.webm'))) {
        const target = videoTarget(scenarios, normalize(file.split(/-\d+-\d+--/)[0]))
        if (target) {
            fs.mkdirSync(target, { recursive: true })
            fs.copyFileSync(path.join(VIDEO_TMP_DIR, file), path.join(target, 'video.webm'))
        }
    }
}

// Carpetas con resultado.json: <ID> o <ID>/<ejemplo> (rutas relativas a EVIDENCE_DIR)
function evidenceFolders () {
    const folders = []
    for (const id of fs.readdirSync(EVIDENCE_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
        if (fs.existsSync(path.join(EVIDENCE_DIR, id, 'resultado.json'))) folders.push(id)
        for (const sub of fs.readdirSync(path.join(EVIDENCE_DIR, id), { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'pasos').map((d) => d.name).sort()) {
            if (fs.existsSync(path.join(EVIDENCE_DIR, id, sub, 'resultado.json'))) folders.push(`${id}/${sub}`)
        }
    }
    return folders
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
        '(`video.webm`) y el resultado (`resultado.json`). Si el escenario tiene varios ejemplos',
        '(Scenario Outline), cada ejemplo tiene su propia subcarpeta. El historial de ejecuciones',
        'anteriores está en el reporte de Allure (`npm run report`, gráficos *Trend* y pestaña *History*).',
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
