# examenPruebaRoy

Resolución del examen de automatización sobre [Hotel QA](https://hotel-qa-f51.pages.dev/).

## Stack

| Herramienta | Rol en el proyecto |
|---|---|
| **JavaScript** | Lenguaje de las pruebas |
| **WebdriverIO** | Controla Chrome: navega, hace clic, escribe y lee la página |
| **Cucumber** | Define los escenarios en lenguaje natural (Gherkin) y los conecta con el código |
| **Page Object Model (POM)** | Cada página de la aplicación es una clase con sus selectores y acciones |
| **Allure Report** | Reporte con resultados, pasos, capturas, videos e historial de ejecuciones |

## Requisitos

- Node.js 20 o superior
- Java 8 o superior (para generar el reporte de Allure)
- Google Chrome
- Windows, solo para `npm run test:evidencias` (el resto funciona en cualquier sistema operativo)

## Instalación

```bash
npm install
```

## Cómo ejecutar las pruebas

### Orden recomendado

```bash
npm run clean        # 1. Borra los resultados de la ejecución anterior
npm test             # 2. Ejecuta las pruebas de regresión
npm run test:bugs    # 3. Ejecuta las pruebas que reproducen defectos (opcional)
npm run report       # 4. Genera y abre el reporte de Allure
```

### Qué hace cada comando

| Comando | Qué hace | Resultado esperado |
|---|---|---|
| `npm run clean` | Borra `allure-results/`, `allure-report/` y `videos/`. **No** borra el historial (`allure-history/`) ni la evidencia (`docs/evidencias/`) | — |
| `npm test` | Ejecuta todos los escenarios **excepto** los `@bug` | Todo en verde |
| `npm run test:bugs` | Ejecuta **solo** los escenarios `@bug`, que reproducen defectos encontrados | Todos fallan a propósito, cada uno en el paso que demuestra el defecto |
| `npm run test:evidencias` | Igual que `test:bugs`, pero con DevTools abierto. Regenera `docs/evidencias/` | Igual que `test:bugs` |
| `npm run report` | Genera el reporte de Allure con el historial de ejecuciones y lo abre en el navegador (se cierra con `Ctrl+C`) | — |

`npm run clean` es importante porque Allure **acumula** resultados: sin limpiar, el reporte mezcla
ejecuciones viejas con nuevas. Se pueden ejecutar varios comandos de prueba seguidos (por ejemplo
`npm test` y `npm run test:bugs`) y el reporte los muestra juntos.

### Qué se registra automáticamente

Al ejecutar las pruebas, sin intervención manual:

- **Captura de cada paso** en Allure, para ver cómo se llega al resultado.
- **Diagnóstico del fallo** cuando un paso falla: URL, sesión guardada, usuario visible y pestañas abiertas.
- **Video** de cada escenario fallido.
- **Historial**: cada `npm run report` agrega la ejecución al gráfico *Trend* de Allure y a la pestaña *History* de cada escenario. El historial se guarda en `allure-history/`.

Con `npm run test:evidencias`, además:

- Chrome se abre con **DevTools** en la pestaña *Console*, y cada captura muestra la página y la consola juntas.
- Las capturas y el video de cada defecto se guardan en `docs/evidencias/<ID>/`.
- Se genera el índice [`docs/evidencias/README.md`](docs/evidencias/README.md) con la fecha y el resultado de cada defecto.

### Qué se ve en cada herramienta

| Herramienta | Dónde se ve |
|---|---|
| WebdriverIO | En pantalla: Chrome ejecutando cada acción |
| Cucumber | En la terminal: cada escenario con sus pasos ✓ / ✖ |
| Allure | En el navegador (`npm run report`): resumen, severidad, pasos, capturas, videos, diagnósticos e historial |

### Comandos útiles

```bash
npx wdio run ./wdio.conf.js --spec ./features/01_login.feature     # un solo feature
npx wdio run ./wdio.conf.js --cucumberOpts.tags="@smoke"           # escenarios con un tag
npx wdio run ./wdio.conf.js --cucumberOpts.tags="@issue=BUG-001"   # un solo defecto
```

## Estructura

```
features/
├── 01_login.feature                        # inciso 1
├── 02_reserva_6_noches.feature             # inciso 2
├── 03_registro_y_reserva_2_noches.feature  # inciso 3
├── 04_mis_reservas.feature                 # inciso 4
├── pageobjects/                            # Page Objects (POM)
│   ├── page.js                             # clase base
│   ├── login.page.js                       # /login
│   ├── register.page.js                    # /registro
│   ├── rooms.page.js                       # /habitaciones
│   ├── roomDetail.page.js                  # /habitaciones/:codigo
│   ├── myBookings.page.js                  # /mis-reservas
│   └── components/
│       ├── bookingModal.js                 # modal de reserva
│       ├── header.js                       # cabecera (usuario, menú, cerrar sesión)
│       └── footer.js                       # pie de página (restablecer datos)
├── step-definitions/                       # implementación de los pasos
│   ├── hooks.js                            # limpieza, capturas, diagnóstico y cierre de pestañas
│   ├── login.steps.js
│   ├── inspection.steps.js                 # inspección de almacenamiento, caché y seguridad
│   ├── register.steps.js
│   ├── booking.steps.js
│   └── myBookings.steps.js
└── support/
    └── inspector.js                        # lectura del navegador, capturas y adjuntos de Allure
docs/
├── REPORTE_DEFECTOS.md                     # defectos con severidad y prioridad
└── evidencias/                             # evidencia de la última ejecución (generada)
scripts/
├── allure-report.js                        # genera el reporte conservando el historial
└── capture-window.ps1                      # captura la ventana con DevTools (test:evidencias)
allure-history/                             # historial de ejecuciones de Allure
wdio.conf.js                                # configuración principal
wdio.devtools.conf.js                       # configuración de evidencias (DevTools abierto)
```

## Cómo funciona la solución

1. **Cucumber** lee los `.feature`. Cada escenario describe un comportamiento en lenguaje de negocio (`Given / When / Then`).
2. Cada paso se conecta con una función en `step-definitions/`. Los steps **no tienen selectores**: solo llaman a los page objects y hacen las verificaciones (`expect`).
3. Los **page objects** (`pageobjects/`) contienen los selectores y las acciones de cada página. Si la página cambia, solo se actualiza su page object.
4. **WebdriverIO** ejecuta todo en Chrome real.
5. Los **hooks** (`hooks.js`) corren alrededor de cada escenario:
   - Antes: limpian el `localStorage`, porque la app guarda ahí sus datos y los escenarios deben ser independientes.
   - Después de cada paso: capturan la pantalla y, si el paso falló, registran el diagnóstico.
   - Al final: cierran las pestañas que haya abierto el escenario.
6. **Allure** recibe cada paso con sus adjuntos y genera el reporte.

## Inciso 1: Login

**Feature:** [`features/01_login.feature`](features/01_login.feature)

### Análisis previo

Antes de automatizar se exploró la pantalla de login y los usuarios de prueba que publica la propia
aplicación, cada uno con un escenario distinto:

| Usuario | Escenario |
|---|---|
| `lvargas` | Huésped, 1 reserva confirmada y 1 finalizada |
| `rmamani` | Huésped, límite de reservas alcanzado (2/2) |
| `sflores` | Frecuente, no-show reciente |
| `dchoque` | Corporativo, check-in mañana |
| `ptorrez` | Usuario bloqueado |
| `admin` | Corporativo, rol admin |

### Escenarios automatizados

| Grupo | Qué se prueba |
|---|---|
| **Positivos** (`@smoke`) | Login de los 5 usuarios activos, verificando la URL, el nombre en la cabecera y el mensaje de bienvenida. Login con la tecla Enter. El usuario no distingue mayúsculas y se recortan sus espacios |
| **Negativos** (`@negative`) | Usuario bloqueado. Credenciales inválidas: contraseña incorrecta, mayúsculas en la contraseña, usuario inexistente, correo en lugar de usuario, contraseña de otro usuario, usuario bloqueado con clave incorrecta, inyección SQL. Contraseña con espacio al final. Campos vacíos o con solo espacios. Entradas de 5000 caracteres |
| **Seguridad y sesión** (`@security`) | Contraseña enmascarada, intento de XSS, rutas protegidas sin sesión, ruta inexistente, la sesión sobrevive a una recarga, un usuario con sesión no vuelve a ver el login, "atrás" después del login, el logout elimina la sesión del almacenamiento |
| **Caché** (`@cache`) | La app no usa Service Workers, Cache Storage ni cookies, y el documento no se guarda en la caché HTTP |
| **Defectos** (`@bug`) | 11 escenarios que reproducen los defectos encontrados (ver abajo) |

### Decisiones técnicas

- **Selectores por `id`** (`#login-username`, `#btn-login`…): son estables y no dependen del texto ni del diseño.
- **Steps parametrizados** (`inicio sesión con usuario {string} y contraseña {string}`): el mismo step sirve para todos los casos y se reutilizará en los demás incisos.
- **`Scenario Outline` con `Examples`** para los casos que solo cambian los datos.
- **Valores con espacios dentro de las comillas del step**, no en `Examples`, porque Gherkin recorta los espacios de las celdas.
- **Inspección del navegador automatizada**: el step `inspecciono el almacenamiento del navegador` revisa lo mismo que DevTools → *Application* (localStorage, cookies, Cache Storage, Service Workers) y lo adjunta a Allure. Otro step revisa el header `Cache-Control`, como en DevTools → *Network*.
- **WebDriver clásico** (`wdio:enforceWebDriverClassic`): con el protocolo BiDi, en esta versión de WebdriverIO, el cambio entre pestañas no cambia el contexto de ejecución, y eso impedía probar el comportamiento con varias pestañas.

### Defectos encontrados

Se encontraron **3 bugs de severidad alta** y **8 defectos de diseño**, documentados con severidad,
prioridad, pasos y evidencia en [`docs/REPORTE_DEFECTOS.md`](docs/REPORTE_DEFECTOS.md):

| ID | Defecto | Severidad |
|---|---|---|
| BUG-001 | Tras cerrar sesión, "atrás" permite ver y operar las reservas | Alta |
| BUG-002 | Un usuario bloqueado con sesión activa conserva el acceso | Alta |
| BUG-003 | Cerrar sesión en una pestaña no la cierra en las demás | Alta |
| DEF-003 | Contraseñas en texto plano en el navegador | Crítica |
| DEF-004 | La sesión se puede suplantar editando el almacenamiento | Crítica |
| DEF-005 | Sin límite de intentos fallidos | Media |
| DEF-007 | La sesión no expira | Media |
| DEF-009 | "Restablecer datos" sin confirmación | Media |
| DEF-006 | El mensaje de error no se limpia al corregir | Baja |
| DEF-008 | Después del login no se vuelve a la página solicitada | Baja |
| DEF-010 | Errores del formulario sin marcado accesible | Baja |

Cada escenario `@bug` tiene los tags `@issue=<ID>` y `@severity=<nivel>`, que Allure muestra en el
reporte. Se excluyen de `npm test` para que la regresión en verde signifique "todo lo que debe
funcionar, funciona", y un fallo signifique "algo nuevo se rompió". Cuando un defecto se corrija,
se quita su tag `@bug` y el escenario pasa a formar parte de la regresión.

## Inciso 2: Reserva de 6 noches

*Pendiente.*

## Inciso 3: Registro y reserva de 2 noches

*Pendiente.*

## Inciso 4: Mis reservas

*Pendiente.*
