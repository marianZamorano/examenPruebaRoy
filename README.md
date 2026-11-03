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

El proyecto no versiona `package-lock.json` (`.npmrc` con `package-lock=false`): las versiones se
resuelven a partir de los rangos de `package.json`.

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
│       ├── calendar.js                     # calendario (búsqueda y reserva)
│       ├── header.js                       # cabecera (usuario, menú, cerrar sesión)
│       └── footer.js                       # pie de página (restablecer datos)
├── step-definitions/                       # implementación de los pasos (sin selectores)
│   ├── hooks.js                            # limpieza, capturas, diagnóstico y cierre de pestañas
│   ├── login.steps.js
│   ├── inspection.steps.js                 # inspección de almacenamiento, caché y seguridad
│   ├── register.steps.js
│   ├── booking.steps.js
│   └── myBookings.steps.js
└── support/
    ├── inspector.js                        # lectura del navegador, capturas y adjuntos de Allure
    └── formatters.js                       # fechas relativas a hoy y montos en Bs
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

**Feature:** [`features/02_reserva_6_noches.feature`](features/02_reserva_6_noches.feature)

> Feature que contenga las funcionalidades de ingresar a la página, ver detalle de una habitación y
> realizar la reserva de la habitación (6 noches).

### Análisis previo

El flujo se exploró con WebdriverIO y con **todos los usuarios de prueba** antes de escribir los
escenarios. Todos los mensajes esperados del feature son los que muestra la aplicación real.

**Flujo:** Habitaciones (24, en 3 páginas) → "Ver detalle" → `/habitaciones/H105` → botón
"Reservar" → formulario (modal) → *"Reserva R0008 confirmada."* → las fechas pasan a "Fechas
ocupadas" → Mis reservas.

**Reglas de la reserva encontradas:**

| Regla | Comportamiento |
|---|---|
| Noches | De 1 a 14. En el calendario, los check-out fuera de ese rango están deshabilitados |
| Fechas | Check-in desde mañana hasta dentro de 180 días. Las fechas ya reservadas están deshabilitadas y un rango no puede cruzarlas |
| Campos | "Confirmar reserva" se habilita al elegir las fechas; al confirmar se validan la hora de llegada, la política de cancelación, el titular (mín. 3 caracteres), el correo (dominio `.test`) y las solicitudes especiales (máx. 200) |
| Huéspedes | De 1 a la capacidad de la habitación |
| Total | Tarifa × noches, con formato `Bs 2.100`. La aplicación lo recalcula aunque se le envíe otro valor |
| Límite de reservas activas | Depende del **tipo de usuario**. Las canceladas, finalizadas y no presentadas no cuentan |
| No-show | Una reserva no presentada en los últimos 30 días impide reservar |

**Comportamiento con cada usuario de prueba:**

| Usuario | Tipo | Reservas activas | Al reservar |
|---|---|---|---|
| `lvargas` | Huésped | 1 de 2 | Reserva una más; la siguiente se rechaza por el límite |
| `rmamani` | Huésped | 2 de 2 | Se rechaza: *"Alcanzó el límite de 2 reservas activas para Huésped."* |
| `sflores` | Frecuente | 0 de 4 | Se rechaza: *"Tiene una reserva no presentada en los últimos 30 días. No puede reservar por ahora."* |
| `dchoque` | Corporativo | 1 de 6 | Reserva hasta 6; la séptima se rechaza |
| `admin` | Corporativo | 0 de 6 | Reserva hasta 6; la séptima se rechaza |
| `ptorrez` | Bloqueado | — | No puede iniciar sesión, así que no llega al formulario |

### Diseño de las pruebas

Igual que en el inciso 1, los escenarios describen lo que la reserva **debería** hacer y están
organizados por funcionalidad:

| Grupo | Qué se prueba |
|---|---|
| **Ingreso y detalle de la habitación** (`@smoke`) | Listado después del login. Detalle desde "Ver detalle" de 3 habitaciones (una en la página 3 del listado): tipo, capacidad, tarifa, piso, vista y servicios. Volver al listado. El formulario muestra la habitación, la tarifa y las reglas. Titular y correo precargados para los 5 usuarios activos. **Disponibilidad:** sin fechas pide elegirlas; con fechas buscadas, el listado y el detalle muestran "Disponible" o "No disponible" (con el botón deshabilitado); "Limpiar fechas" la quita; al volver del detalle se conservan las fechas buscadas |
| **Reserva de 6 noches** (`@smoke`) | Reserva de 6 noches con `lvargas`, `dchoque` y `admin`: resumen (6 noches, Bs 2.100), confirmación, cierre del formulario y fechas ocupadas en el detalle. **En Mis reservas:** código, habitación, check-in, check-out, noches, huéspedes, total, modificaciones 0/1, estado "Confirmada", acciones disponibles y contador de reservas activas. También desde el botón "Reservar" del listado, con las fechas buscadas precargadas (desde el detalle y desde el listado) y para 4 huéspedes. La reserva persiste al recargar y varios clics seguidos crean una sola |
| **Rango de noches** | Se puede elegir 1 y 14 noches, pero no 15. El mismo día como check-out no crea una estadía de 0 noches. No se puede elegir un check-out anterior al check-in |
| **Fechas permitidas** | Navegación del calendario: no retrocede antes del mes actual ni avanza después del mes del día 180; se abre y cierra con su botón y con el campo. Ayer y hoy deshabilitados, mañana habilitado, día 180 habilitado y día 181 deshabilitado. Las fechas reservadas se bloquean y una estadía no puede cruzarlas. Dos pestañas no pueden reservar las mismas fechas |
| **Campos obligatorios y validaciones** (`@negative`) | Hora de llegada, política de cancelación, titular (vacío, 2 caracteres, solo espacios, con números), correo (vacío, dominio real, sin arroba), solicitudes especiales (200 sí, 201 no). Huéspedes según la capacidad. Cancelar y Escape cierran sin reservar. Un intento de XSS en el titular y en las solicitudes no ejecuta código |
| **Cálculo del total** | Tarifa × noches para 1, 6 y 14 noches (Bs 180, Bs 2.100, Bs 16.800), en el formulario y en Mis reservas |
| **Reglas fuera del formulario** (`@security`) | Se envían a la lógica de la aplicación (`window.__hotelApi`) datos que el calendario no permite elegir: 0 y 15 noches, check-in hoy o después de 180 días, más huéspedes que la capacidad, fechas ocupadas y un total manipulado. También un `userId` ajeno, cancelar o modificar la reserva de otro usuario y reservar estando bloqueado. Verifica que las reglas no dependan solo de la interfaz |
| **Límite de reservas activas y estado del usuario** | Contador "Reservas activas: X de N" de los 5 usuarios activos. El límite de cada tipo de usuario: Huésped 2 (`lvargas`, `rmamani`), Corporativo 6 (`dchoque`, `admin`), también reservando desde dos pestañas. El no-show de `sflores`. Aviso al abrir el formulario cuando el usuario no puede reservar |
| **Accesibilidad** (`@accessibility`) | El foco pasa al formulario al abrirlo. Los errores se marcan de forma accesible |

**Sin duplicar otros incisos:** el inciso 2 prueba solo lo propio de ver el detalle y reservar. No
repite lo que ya cubre el inciso 1: que `ptorrez` (bloqueado) no pueda iniciar sesión, las rutas
protegidas y la sesión entre pestañas. El usuario bloqueado se prueba únicamente contra la lógica de
la reserva (BUG-004), para no depender de BUG-002. Los filtros y el orden del listado y los filtros
de Mis reservas quedan fuera porque no forman parte del flujo pedido (los de Mis reservas
corresponden al inciso 4).

### Decisiones técnicas

- **Fechas relativas a hoy**: los escenarios dicen "dentro de 30 días" y [`features/support/formatters.js`](features/support/formatters.js) calcula la fecha, el formato `dd/mm/aaaa` y el monto `Bs 2.100`. Las pruebas funcionan cualquier día.
- **Calendario como componente**: la búsqueda del listado y el formulario usan el mismo calendario con distintos ids, así que [`calendar.js`](features/pageobjects/components/calendar.js) lo implementa una sola vez (`new Calendar('search')` y `new Calendar('reservation')`). Navega por los meses hasta el día pedido (atributo `data-date`); los steps solo dicen qué fecha elegir.
- **Listado paginado**: `RoomsPage.showRoom` avanza de página hasta encontrar la fila de la habitación, como lo haría un usuario. La fila se busca por el código y no por el enlace, porque con fechas buscadas el enlace incluye `?checkIn=…&checkOut=…`.
- **La reserva se identifica por su código**: se toma del mensaje de confirmación y se usa para encontrar la fila en Mis reservas.
- **"La reserva no debería crearse"** no solo revisa la pantalla: compara la cantidad de reservas del usuario en el almacenamiento antes y después de confirmar.
- **Precondiciones desde la interfaz**: "completé mis reservas activas hasta el límite" lee el límite en Mis reservas y crea las reservas necesarias con el formulario, sin modificar datos a mano.
- **Esperas explícitas**: los mensajes de validación tardan cerca de un segundo; las verificaciones usan las esperas de `expect` de WebdriverIO, no pausas fijas.
- **Steps reutilizados del inciso 1**: inicio de sesión, menú, recarga, rutas y mensajes de error del login.

### Defectos encontrados

Al ejecutar las pruebas se encontraron **6 defectos: 1 bug de severidad alta y 5 de severidad
baja**. Fallan 8 escenarios, porque algunos defectos se prueban en más de un caso. Se
documentaron en [`docs/REPORTE_DEFECTOS.md`](docs/REPORTE_DEFECTOS.md):

| ID | Defecto | Severidad |
|---|---|---|
| BUG-004 | Un usuario bloqueado puede seguir creando reservas: la reserva no valida el estado del usuario | Alta |
| DEF-015 | Al volver del detalle se pierden las fechas buscadas | Baja |
| DEF-013 | Quien no puede reservar (límite o no-show) se entera recién al confirmar | Baja |
| DEF-014 | El nombre del titular acepta números | Baja |
| DEF-011 | El foco no pasa al formulario de reserva al abrirlo | Baja |
| DEF-012 | El formulario de reserva no marca de forma accesible los errores | Baja |

Las reglas de negocio principales (noches, fechas, campos, total y límite) **se cumplen**, también
fuera de la interfaz y desde dos pestañas. La excepción es el **estado del usuario**: la reserva no
verifica si el usuario está bloqueado (BUG-004). Este bug se encontró en una segunda exploración
dirigida a los riesgos de severidad alta: usuario bloqueado, XSS, reservas a nombre de otro
usuario y concurrencia entre pestañas. El resto de esos riesgos se cumplió y quedó como prueba de
regresión `@security`. Una tercera revisión cubrió las funciones del flujo que faltaban (reservar
desde el listado, disponibilidad por fechas, varios huéspedes y navegación del calendario) y
encontró DEF-015.

Durante el análisis, varios fallos resultaron ser **errores de la prueba** y se corrigieron sin
reportarlos: la tabla de habitaciones aún no se había dibujado después del login, el formulario
abierto tapaba el menú y un escenario suponía que se podía elegir un check-out anterior al check-in
(el calendario lo deshabilita, que es lo correcto).

También se detectó y corrigió un **falso positivo**: el paso "la reserva no debería crearse"
verificaba de inmediato, pero la app tarda cerca de un segundo en guardar la reserva. Cuando ningún
paso anterior esperaba un mensaje, la verificación pasaba antes de que la reserva se creara, y el
escenario del usuario bloqueado salía en verde aunque la exploración mostraba lo contrario. Ahora el
paso espera la respuesta de la app (confirmación o error) antes de verificar.

## Inciso 3: Registro y reserva de 2 noches

*Pendiente.*

## Inciso 4: Mis reservas

*Pendiente.*
