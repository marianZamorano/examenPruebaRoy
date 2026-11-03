/**
* Genera el reporte de Allure conservando el historial de ejecuciones.
*
* Allure arma los gráficos de tendencia (Trend) y la pestaña History de cada
* escenario a partir de la carpeta "history" de la ejecución anterior. Este
* script la guarda en allure-history/ (que se sube al repositorio) para que el
* historial no se pierda al limpiar o al clonar el proyecto.
*
* 1. Copia allure-history/ → allure-results/history
* 2. Registra el entorno y el número de ejecución
* 3. Genera allure-report/
* 4. Copia allure-report/history → allure-history/
*/
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const RESULTS = path.join(root, 'allure-results')
const REPORT = path.join(root, 'allure-report')
const HISTORY = path.join(root, 'allure-history')

if (!fs.existsSync(RESULTS)) {
    console.error('No hay resultados en allure-results/. Ejecute primero las pruebas (npm test).')
    process.exit(1)
}

// 1. Historial de ejecuciones anteriores
if (fs.existsSync(HISTORY)) {
    fs.cpSync(HISTORY, path.join(RESULTS, 'history'), { recursive: true })
}

// 2. Entorno (widget Environment) y número de ejecución (etiquetas del gráfico Trend)
const trendFile = path.join(HISTORY, 'history-trend.json')
const previousRuns = fs.existsSync(trendFile) ? JSON.parse(fs.readFileSync(trendFile, 'utf8')).length : 0
const buildOrder = previousRuns + 1
const wdioVersion = require(path.join(root, 'node_modules', '@wdio', 'cli', 'package.json')).version

fs.writeFileSync(path.join(RESULTS, 'environment.properties'), [
    'Aplicacion=https://hotel-qa-f51.pages.dev',
    'Navegador=Google Chrome',
    `WebdriverIO=${wdioVersion}`,
    `Node.js=${process.version}`,
    `Sistema=${os.type()} ${os.release()}`
].join('\n'))

fs.writeFileSync(path.join(RESULTS, 'executor.json'), JSON.stringify({
    name: 'Ejecución local',
    type: 'local',
    buildOrder,
    buildName: `Ejecución #${buildOrder} — ${new Date().toLocaleString('es-BO')}`
}, null, 2))

// 3. Reporte
execSync('allure generate allure-results --clean -o allure-report', { cwd: root, stdio: 'inherit' })

// 4. Historial actualizado para la próxima ejecución
fs.rmSync(HISTORY, { recursive: true, force: true })
fs.cpSync(path.join(REPORT, 'history'), HISTORY, { recursive: true })
console.log(`Historial actualizado en allure-history/ (ejecución #${buildOrder}).`)
