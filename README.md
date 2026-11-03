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
npm test             # 2. Ejecuta todas las pruebas (incluye los defectos)
npm run report       # 3. Genera y abre el reporte de Allure
```

Con eso, el reporte de Allure muestra en una sola ejecución lo que funciona (en verde) y los
defectos encontrados (en rojo, con su ID, severidad, capturas, video y diagnóstico).

### Qué hace cada comando

| Comando | Qué hace | Resultado esperado |
|---|---|---|
| `npm run clean` | Borra `allure-results/`, `allure-report/` y `videos/`. **No** borra el historial (`allure-history/`) ni la evidencia (`docs/evidencias/`) | — |
| `npm test` | Ejecuta **todos** los escenarios, incluidos los `@bug` | Los escenarios de regresión pasan y los `@bug` fallan, cada uno en el paso que demuestra el defecto |
| `npm run test:regresion` | Ejecuta todo **excepto** los `@bug`: solo lo que debe funcionar | Todo en verde |
| `npm run test:bugs` | Ejecuta **solo** los escenarios `@bug` | Todos fallan mientras el defecto exista |
| `npm run test:evidencias` | Igual que `test:bugs`, pero con DevTools abierto. Regenera `docs/evidencias/` | Igual que `test:bugs` |
| `npm run report` | Genera el reporte de Allure con el historial de ejecuciones y lo abre en el navegador (se cierra con `Ctrl+C`) | — |
| `npm run allure:open` | Vuelve a abrir el último reporte generado, sin regenerarlo ni sumar una ejecución al historial | — |

`npm test` termina con error (en rojo) mientras existan defectos: refleja el estado real de la
aplicación. Para saber si algo **nuevo** se rompió, se usa `npm run test:regresion`, que debe estar
siempre en verde.

`npm run clean` es importante porque Allure **acumula** resultados: sin limpiar, el reporte mezcla
ejecuciones viejas con nuevas.

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
npx wdio run ./wdio.conf.js --cucumberOpts.tags="@security and not @bug"   # combinación de tags
```

## Tags

Los escenarios se clasifican con tags de Cucumber. Sirven para **filtrar qué se ejecuta** (con
`--cucumberOpts.tags`) y algunos, además, **se muestran en Allure**.

### Tipo de prueba

| Tag | Significado |
|---|---|
| `@smoke` | Prueba básica del flujo principal: si falla, lo demás no tiene sentido. Es lo primero que se ejecuta para validar que la aplicación funciona |
| `@negative` | Caso negativo: datos inválidos o situaciones que la aplicación debe rechazar con el mensaje correcto |
| `@security` | Seguridad: credenciales, sesión, control de acceso, inyección de código |
| `@cache` | Caché y almacenamiento del navegador (lo que se revisa en DevTools → *Application* y *Network*) |
| `@accessibility` | Accesibilidad: que la aplicación se pueda usar con lectores de pantalla y teclado |

Un escenario puede tener varios tags. Por ejemplo, `@security @cache` es una prueba de seguridad
relacionada con la caché.

### Estado de un defecto

Solo los llevan los escenarios cuyo comportamiento esperado la aplicación **no cumple actualmente**:

| Tag | Significado | En Allure |
|---|---|---|
| `@bug` | El escenario detectó un defecto que ya está reportado. Falla mientras el defecto exista; cuando se corrige, se quita el tag | — |
| `@issue=<ID>` | ID del defecto en [`docs/REPORTE_DEFECTOS.md`](docs/REPORTE_DEFECTOS.md) (por ejemplo `@issue=BUG-001`) | Se muestra como enlace del escenario |
| `@severity=<nivel>` | Severidad del defecto | Se muestra como severidad del escenario y en el gráfico de severidades |

Equivalencia entre la severidad del reporte de defectos y el nivel de Allure:

| Severidad en el reporte | `@severity=` en Allure |
|---|---|
| Crítica | `blocker` |
| Alta | `critical` |
| Media | `normal` |
| Baja | `minor` |

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

### Diseño de las pruebas

Los escenarios se diseñaron a partir de lo que el login **debería** hacer, organizados por
funcionalidad. Cada uno describe el comportamiento esperado, no un defecto:

| Grupo | Qué se prueba |
|---|---|
| **Inicio de sesión exitoso** (`@smoke`) | Login de los 5 usuarios activos, verificando la URL, el nombre en la cabecera y el mensaje de bienvenida. Login con la tecla Enter. El usuario no distingue mayúsculas y se recortan sus espacios |
| **Validación de credenciales** (`@negative`) | Usuario bloqueado. Credenciales inválidas: contraseña incorrecta, mayúsculas en la contraseña, usuario inexistente, correo en lugar de usuario, contraseña de otro usuario, usuario bloqueado con clave incorrecta, inyección SQL. Contraseña con espacio al final. Campos vacíos o con solo espacios. Entradas de 5000 caracteres |
| **Seguridad del formulario y de las credenciales** (`@security`) | Contraseña enmascarada, intento de XSS, protección ante intentos fallidos, las contraseñas no se guardan legibles en el navegador |
| **Control de acceso** | Rutas protegidas sin sesión, ruta inexistente, volver a la página solicitada después del login |
| **Manejo de la sesión** | La sesión sobrevive a una recarga, un usuario con sesión no vuelve a ver el login, "atrás" después del login, el logout elimina la sesión y no deja datos visibles (ni con "atrás" ni en otras pestañas), un usuario bloqueado pierde el acceso, la sesión no se puede suplantar y tiene expiración |
| **Caché del navegador** (`@cache`) | La app no usa Service Workers, Cache Storage ni cookies, y el documento no se guarda en la caché HTTP |
| **Usabilidad y accesibilidad** | El mensaje de error desaparece al corregir, las acciones destructivas piden confirmación, los errores se marcan de forma accesible |

### Ciclo de un defecto

Los defectos **no se conocían de antemano**: aparecieron al ejecutar las pruebas diseñadas. El ciclo
que se siguió con cada uno:

1. **Diseño:** se escribe el escenario con el comportamiento esperado. Por ejemplo, *"Cerrar sesión en una pestaña cierra la sesión en las demás"*.
2. **Ejecución:** si la aplicación lo cumple, el escenario pasa y queda como prueba de regresión.
3. **Análisis del fallo:** si falla, se investiga si el error está en la prueba o en la aplicación, con las capturas, el video y el diagnóstico que registra Allure.
4. **Reporte:** si el error es de la aplicación, se documenta el defecto en [`docs/REPORTE_DEFECTOS.md`](docs/REPORTE_DEFECTOS.md) con su severidad, prioridad y evidencia.
5. **Etiquetado:** el escenario recibe los tags `@bug`, `@issue=<ID>` y `@severity=<nivel>`. La prueba no cambia: los tags solo indican que ese fallo ya está reportado y lo enlazan con su ficha.
6. **Corrección:** cuando el defecto se corrige, el escenario pasa a verde (siempre verificó el comportamiento correcto), se quitan los tags y sigue vigilando que el defecto no vuelva.

### Decisiones técnicas

- **Selectores por `id`** (`#login-username`, `#btn-login`…): son estables y no dependen del texto ni del diseño.
- **Steps parametrizados** (`inicio sesión con usuario {string} y contraseña {string}`): el mismo step sirve para todos los casos y se reutilizará en los demás incisos.
- **`Scenario Outline` con `Examples`** para los casos que solo cambian los datos.
- **Valores con espacios dentro de las comillas del step**, no en `Examples`, porque Gherkin recorta los espacios de las celdas.
- **Inspección del navegador automatizada**: el step `inspecciono el almacenamiento del navegador` revisa lo mismo que DevTools → *Application* (localStorage, cookies, Cache Storage, Service Workers) y lo adjunta a Allure. Otro step revisa el header `Cache-Control`, como en DevTools → *Network*.
- **WebDriver clásico** (`wdio:enforceWebDriverClassic`): con el protocolo BiDi, en esta versión de WebdriverIO, el cambio entre pestañas no cambia el contexto de ejecución, y eso impedía probar el comportamiento con varias pestañas.

### Defectos encontrados

Al ejecutar las pruebas, 11 escenarios no se cumplieron: **3 bugs de severidad alta** y **8 defectos
de diseño**, documentados con severidad, prioridad, pasos y evidencia en
[`docs/REPORTE_DEFECTOS.md`](docs/REPORTE_DEFECTOS.md):

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

`npm test` ejecuta todos los escenarios, así que cada ejecución verifica si los defectos siguen
existiendo y los documenta en Allure. `npm run test:regresion` excluye los `@bug`: su resultado en
verde significa "todo lo que debe funcionar, funciona", y un fallo significa "algo nuevo se rompió".

## Inciso 2: Reserva de 6 noches

*Pendiente.*

## Inciso 3: Registro y reserva de 2 noches

*Pendiente.*

## Inciso 4: Mis reservas

*Pendiente.*
