# Reporte de defectos — Hotel QA

| | |
|---|---|
| **Aplicación** | [Hotel QA](https://hotel-qa-f51.pages.dev/) |
| **Módulos evaluados** | Inicio de sesión y manejo de sesión (Inciso 1) · Detalle y reserva de habitación (Inciso 2) · Registro de usuario y reserva del usuario nuevo (Inciso 3) |
| **Fecha** | 03/11/2026 |
| **Entorno** | Windows 11 · Google Chrome 156 · WebdriverIO 10 · Cucumber · Allure |
| **Datos de prueba** | Usuarios de prueba publicados en la pantalla de login |

Todos los defectos se detectaron **al ejecutar los escenarios diseñados** en
[`features/01_login.feature`](../features/01_login.feature),
[`features/02_reserva_6_noches.feature`](../features/02_reserva_6_noches.feature) y
[`features/03_registro_y_reserva_2_noches.feature`](../features/03_registro_y_reserva_2_noches.feature),
que describen el comportamiento esperado. El escenario que detectó cada defecto se etiquetó con `@bug`
y `@issue=<ID>`, y falla en el paso donde la aplicación no cumple lo esperado. Si un inciso reproduce
un defecto ya reportado, su escenario usa el **mismo ID** y la ficha lo lista como escenario adicional:
no se reporta dos veces.

## Cómo reproducir y generar la evidencia

```bash
npm run clean             # borra resultados anteriores (el historial se conserva)
npm test                  # ejecuta todos los escenarios, incluidos los que detectaron defectos
npm run report            # reporte de Allure con historial de ejecuciones
```

Para regenerar la evidencia con DevTools de `docs/evidencias/` se usa `npm run test:evidencias`,
que ejecuta solo los escenarios `@bug`.

Sin intervención manual, la suite registra:

- **Captura de cada paso** en Allure. Con `test:evidencias` la captura incluye DevTools y también se guarda en `docs/evidencias/<ID>/pasos/`; el paso que falla lleva `FALLO` en el nombre.
- **Diagnóstico del fallo**: URL, sesión guardada en el navegador, usuario visible en la cabecera y pestañas abiertas.
- **Almacenamiento del navegador**: localStorage, sessionStorage, cookies, Cache Storage, Service Workers e IndexedDB (en los escenarios que lo inspeccionan).
- **Video** de cada escenario fallido.
- **Índice** [`evidencias/README.md`](evidencias/README.md) con la fecha y el resultado de cada defecto en la última ejecución.

**Historial:** `docs/evidencias/` contiene solo la última ejecución. Las ejecuciones anteriores se ven
en el reporte de Allure (gráfico *Trend* y pestaña *History* de cada escenario), cuyo historial se
guarda en `allure-history/`, y en el historial de git.

## Criterios de clasificación

**Severidad**: qué tan grave es el impacto del defecto sobre el sistema o el usuario.

| Severidad | Criterio | Etiqueta en Allure |
|---|---|---|
| Crítica | Compromete la seguridad o los datos de todos los usuarios | `blocker` |
| Alta | Expone datos o permite acciones no autorizadas en un flujo principal | `critical` |
| Media | Afecta una función o control importante, pero hay mitigación | `normal` |
| Baja | Problema de usabilidad o accesibilidad sin impacto funcional | `minor` |

**Prioridad**: qué tan pronto debe corregirse, considerando el contexto del producto.

| Prioridad | Criterio |
|---|---|
| Alta | Corregir antes de la siguiente entrega |
| Media | Planificar en el siguiente ciclo |
| Baja | Corregir cuando haya capacidad |

> La severidad y la prioridad no siempre coinciden. La aplicación se declara como
> *"Entorno de práctica · datos ficticios en localStorage"*, por lo que algunos defectos
> con severidad crítica en un sistema real tienen aquí una prioridad menor.

**Tipos de hallazgo**

- **Bug**: comportamiento incorrecto en un flujo que el usuario realiza desde la interfaz.
- **Defecto de diseño**: debilidad de seguridad, usabilidad o accesibilidad que no rompe el flujo normal, pero habilita un uso indebido o empeora la experiencia.

## Resumen

| ID | Título | Tipo | Severidad | Prioridad |
|---|---|---|---|---|
| [BUG-001](#bug-001) | Tras cerrar sesión, "atrás" permite ver y operar las reservas | Bug · Seguridad | Alta | Alta |
| [BUG-002](#bug-002) | Un usuario bloqueado con sesión activa conserva el acceso | Bug · Seguridad | Alta | Alta |
| [BUG-003](#bug-003) | Cerrar sesión en una pestaña no la cierra en las demás | Bug · Seguridad | Alta | Alta |
| [BUG-004](#bug-004) | Un usuario bloqueado puede seguir creando reservas | Bug · Seguridad | Alta | Alta |
| [DEF-003](#def-003) | Contraseñas almacenadas en texto plano en el navegador | Defecto de diseño · Seguridad | Crítica | Media |
| [DEF-004](#def-004) | La sesión puede suplantarse editando el almacenamiento | Defecto de diseño · Seguridad | Crítica | Media |
| [DEF-005](#def-005) | Sin límite de intentos fallidos de inicio de sesión | Defecto de diseño · Seguridad | Media | Media |
| [DEF-007](#def-007) | La sesión no expira | Defecto de diseño · Seguridad | Media | Media |
| [DEF-018](#def-018) | Se acepta una contraseña igual al nombre de usuario | Defecto de diseño · Seguridad | Media | Media |
| [DEF-017](#def-017) | Un nombre sin largo máximo rompe la pantalla y oculta "Cerrar sesión" | Bug · Validación de datos | Media | Baja |
| [DEF-009](#def-009) | "Restablecer datos" se ejecuta sin pedir confirmación | Bug · Usabilidad | Media | Baja |
| [DEF-006](#def-006) | El mensaje de error no se limpia al corregir los datos | Bug · Usabilidad | Baja | Baja |
| [DEF-008](#def-008) | Después del login no se vuelve a la página solicitada | Defecto de diseño · Usabilidad | Baja | Baja |
| [DEF-010](#def-010) | El formulario no marca de forma accesible los errores | Defecto de diseño · Accesibilidad | Baja | Baja |
| [DEF-013](#def-013) | Quien no puede reservar se entera recién al confirmar | Defecto de diseño · Usabilidad | Baja | Media |
| [DEF-015](#def-015) | Al volver del detalle se pierden las fechas buscadas | Defecto de diseño · Usabilidad | Baja | Media |
| [DEF-014](#def-014) | Los nombres de persona aceptan números (titular de la reserva y registro) | Bug · Validación de datos | Baja | Baja |
| [DEF-016](#def-016) | Con sesión iniciada se puede abrir el registro y crear cuentas | Defecto de diseño · Control de acceso | Baja | Baja |
| [DEF-011](#def-011) | El foco no pasa al formulario de reserva al abrirlo | Defecto de diseño · Accesibilidad | Baja | Baja |
| [DEF-012](#def-012) | El formulario de reserva no marca de forma accesible los errores | Defecto de diseño · Accesibilidad | Baja | Baja |

BUG-001 a BUG-003 y DEF-003 a DEF-010 corresponden al inciso 1 (login); BUG-004 y DEF-011 a DEF-015, al inciso 2 (reserva); DEF-016 a DEF-018, al inciso 3 (registro). El inciso 3 también reproduce DEF-003, DEF-010 y DEF-014 en el registro, con el mismo ID.

La evidencia de la última ejecución (captura de cada paso con DevTools, video y resultado de cada defecto) está en [`evidencias/`](evidencias/README.md), con un índice generado automáticamente.

---

## BUG-001

**Tras cerrar sesión, "atrás" permite ver y operar las reservas**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Alta | Alta | *Tras cerrar sesión, volver atrás no muestra datos del usuario* |

**Pasos**
1. Iniciar sesión con `lvargas` / `Huesped123!`.
2. Navegar a `/mis-reservas`.
3. Cerrar sesión.
4. Presionar "Atrás" en el navegador.
5. Hacer clic en "Mis reservas".

**Resultado esperado:** al volver atrás después del logout, la aplicación muestra el login.

**Resultado obtenido:** se muestran "Lucía Vargas" y todas sus reservas, con los botones "Modificar fechas" y "Cancelar" disponibles. La inspección del almacenamiento confirma que la sesión **ya no existe** (`hotel-qa:session` es `null`).

**Análisis:** Chrome restaura la página desde su caché de navegación (*back/forward cache*). La aplicación guarda la sesión en memoria al cargar (`AuthProvider` la lee una sola vez) y no la vuelve a validar contra el almacenamiento. Es la misma causa raíz de [BUG-003](#bug-003).

**Impacto:** en una computadora compartida, la siguiente persona puede ver y operar las reservas del usuario anterior.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/BUG-001/)

---

## BUG-002

**Un usuario bloqueado con sesión activa conserva el acceso**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Alta | Alta | *Un usuario bloqueado durante su sesión debería perder el acceso* |

**Pasos**
1. Iniciar sesión con `lvargas`.
2. Bloquear al usuario. La aplicación no tiene pantalla de administración, así que la prueba cambia su estado a `"bloqueado"` en el almacenamiento, igual a como está guardado `ptorrez`.
3. Recargar la página.

**Resultado esperado:** el usuario pierde el acceso, de forma coherente con el mensaje *"Usuario bloqueado. Contacte a recepción."* que recibe `ptorrez` al ingresar.

**Resultado obtenido:** el usuario sigue dentro con acceso completo, aunque el almacenamiento confirma `status: "bloqueado"`.

**Análisis:** el estado del usuario solo se valida al iniciar sesión.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/BUG-002/)

---

## BUG-003

**Cerrar sesión en una pestaña no la cierra en las demás**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Alta | Alta | *Cerrar sesión en una pestaña cierra la sesión en las demás* |

**Pasos**
1. Iniciar sesión con `lvargas`.
2. Abrir la aplicación en una segunda pestaña.
3. Cerrar sesión en la pestaña 1.
4. En la pestaña 2, hacer clic en "Mis reservas".

**Resultado esperado:** la pestaña 2 también pierde la sesión y lleva al login.

**Resultado obtenido:** la pestaña 2 muestra "Lucía Vargas" y sus reservas, con "Modificar fechas" y "Cancelar" disponibles. El almacenamiento confirma que la sesión no existe.

**Análisis:** la aplicación no escucha cambios del almacenamiento (evento `storage`) ni vuelve a validar la sesión al navegar. Es la misma causa raíz de [BUG-001](#bug-001), pero no depende del caché del navegador.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/BUG-003/)

---

## BUG-004

**Un usuario bloqueado puede seguir creando reservas**

| Severidad | Prioridad | Escenarios |
|---|---|---|
| Alta | Alta | *Un usuario bloqueado no puede reservar fuera del formulario* |

**Pasos**
1. Iniciar sesión con `dchoque`.
2. Bloquear al usuario. Igual que en [BUG-002](#bug-002), la prueba cambia su estado a `"bloqueado"` en el almacenamiento, como está guardado `ptorrez`.
3. Solicitar a la lógica de la aplicación (`window.__hotelApi.createReservation`) una reserva de `H105` por 6 noches, con check-in dentro de 30 días.

**Resultado esperado:** la reserva se rechaza porque el usuario está bloqueado.

**Resultado obtenido:** `ok: true`. La reserva queda guardada como "Confirmada" en Mis reservas y sus fechas pasan a estar ocupadas para los demás huéspedes. En la exploración también se confirmó desde el formulario (*"Reserva R0008 confirmada."*) con `lvargas` y `dchoque`, después de recargar la página.

**Análisis:** la creación de la reserva valida noches, fechas, capacidad, solapamiento, límite de reservas y no-show, pero **no el estado del usuario**.

**Por qué no duplica [BUG-002](#bug-002):** BUG-002 es que el usuario bloqueado conserva la sesión. Este defecto es que la **reserva** no valida el estado del usuario. Por eso se prueba directamente contra la lógica de la reserva y no desde la interfaz: desde la interfaz, el escenario dependería de BUG-002 y pasaría en cuanto se corrija la sesión, aunque la reserva siga sin validar el estado. Corregir BUG-002 no corrige este defecto.

**Impacto:** un usuario que recepción bloqueó puede ocupar habitaciones (hasta 6 si es Corporativo), y esas fechas dejan de estar disponibles para otros huéspedes.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/BUG-004/)

---

## DEF-003

**Contraseñas almacenadas en texto plano en el navegador**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Crítica | Media | *Las contraseñas no se guardan legibles en el navegador* (inciso 1) · *La contraseña del usuario nuevo no se guarda legible* (inciso 3) |

**Pasos:** abrir la aplicación (sin iniciar sesión) e inspeccionar el almacenamiento del navegador. En el inciso 3: registrar un usuario nuevo desde el formulario e inspeccionar lo que se guardó.

**Resultado esperado:** las contraseñas no son accesibles desde el cliente, o están protegidas con un hash.

**Resultado obtenido:** `localStorage["hotel-qa:db"]` contiene todos los usuarios con su contraseña legible (por ejemplo, `admin` / `Admin123!`). El registro también guarda así la contraseña de cada usuario nuevo (`"password": "Clave123!"`): el defecto no está solo en los datos sembrados, sino en cómo la aplicación guarda las contraseñas.

**Prioridad:** Media, porque la aplicación declara que guarda datos ficticios en localStorage. En un sistema real sería Alta.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-003/)

---

## DEF-004

**La sesión puede suplantarse editando el almacenamiento**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Crítica | Media | *No se puede suplantar una sesión editando el almacenamiento* |

**Pasos:** sin iniciar sesión, guardar `localStorage.setItem('hotel-qa:session', 'U001')` y recargar.

**Resultado esperado:** no se puede acceder sin credenciales válidas.

**Resultado obtenido:** se ingresa como "Ana Admin" (rol admin) sin contraseña.

**Análisis:** la sesión es solo el identificador del usuario, sin un token firmado ni validación.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-004/)

---

## DEF-005

**Sin límite de intentos fallidos de inicio de sesión**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Media | Media | *La cuenta se protege tras varios intentos fallidos* |

**Pasos:** 8 intentos con `lvargas` y contraseña incorrecta; luego, el intento con la contraseña correcta.

**Resultado esperado:** después de varios intentos fallidos, la cuenta se bloquea temporalmente o se pide un captcha.

**Resultado obtenido:** los 8 intentos responden igual y el noveno entra normalmente. La consola registra el mensaje de cada intento.

**Nota:** no hay un requisito explícito. Se reporta según buenas prácticas (OWASP) contra ataques de fuerza bruta.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-005/)

---

## DEF-006

**El mensaje de error no se limpia al corregir los datos**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Baja | *El mensaje de error desaparece al corregir los datos* |

**Pasos:** enviar el formulario vacío y luego escribir en "Usuario".

**Resultado esperado:** el mensaje *"Ingrese usuario y contraseña."* desaparece al empezar a corregir.

**Resultado obtenido:** el mensaje sigue visible hasta el siguiente envío.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-006/)

---

## DEF-007

**La sesión no expira**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Media | Media | *La sesión almacenada tiene fecha de expiración* |

**Pasos:** iniciar sesión e inspeccionar `hotel-qa:session`.

**Resultado esperado:** la sesión tiene un tiempo de vida, sobre todo sin una opción "Recordarme".

**Resultado obtenido:** la sesión es solo `"U002"`, sin fecha de expiración. Al estar en localStorage, sigue activa indefinidamente, incluso después de cerrar el navegador.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-007/)

---

## DEF-008

**Después del login no se vuelve a la página solicitada**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Baja | *Después del login se vuelve a la página solicitada* |

**Pasos:** sin sesión, abrir `/mis-reservas` (redirige al login) e iniciar sesión.

**Resultado esperado:** el usuario llega a `/mis-reservas`.

**Resultado obtenido:** siempre se redirige a `/habitaciones`.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-008/)

---

## DEF-009

**"Restablecer datos" se ejecuta sin pedir confirmación**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Media | Baja | *Restablecer datos pide confirmación* |

**Pasos:** con sesión iniciada, hacer clic en "Restablecer datos" (pie de página).

**Resultado esperado:** al ser una acción destructiva, se pide confirmación.

**Resultado obtenido:** se ejecuta de inmediato (cierra la sesión y restablece los datos) sin diálogo ni mensaje.

**Prioridad:** Baja, porque es una herramienta del entorno de práctica.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-009/)

---

## DEF-010

**El formulario no marca de forma accesible los errores**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Baja | *Los errores del formulario se marcan de forma accesible* (inciso 1, login) · *Los errores del registro se marcan de forma accesible* (inciso 3) |

**Pasos:** enviar el formulario vacío (login o registro) e inspeccionar los campos.

**Resultado esperado:** los campos con error tienen `aria-invalid="true"` y `aria-describedby` apuntando al mensaje, y el foco va al primer campo con error (WCAG 3.3.1).

**Resultado obtenido:** `aria-invalid` y `aria-describedby` son `null` en todos los campos. En el registro, el foco se queda en el botón "Crear cuenta".

**Nota:** el formulario de reserva tiene el mismo problema y se reportó aparte ([DEF-012](#def-012)) en el inciso 2. El registro se referencia aquí, en lugar de crear otro defecto, porque es la misma causa.

**Aspectos correctos:** el mensaje de error tiene `role="alert"` y los campos tienen su `<label>`.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-010/)

---

## DEF-011

**El foco no pasa al formulario de reserva al abrirlo**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Baja | *El foco pasa al formulario de reserva al abrirlo* |

**Pasos:** iniciar sesión con `lvargas`, abrir el detalle de `H105` y hacer clic en "Reservar".

**Resultado esperado:** el foco pasa a un elemento del diálogo, como indica el patrón de diálogo modal de WAI-ARIA (`role="dialog"`, `aria-modal="true"`).

**Resultado obtenido:** `document.activeElement` sigue siendo el botón "Reservar", detrás del modal. Un usuario de teclado o de lector de pantalla no sabe que se abrió el formulario.

**Aspectos correctos:** el diálogo tiene `role="dialog"`, `aria-modal` y título asociado, y se cierra con Escape.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-011/)

---

## DEF-012

**El formulario de reserva no marca de forma accesible los errores**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Baja | *Los errores del formulario de reserva se marcan de forma accesible* |

**Pasos:** abrir el formulario de reserva de `H105`, elegir las fechas, aceptar la política sin elegir la hora de llegada y confirmar.

**Resultado esperado:** el campo con error tiene `aria-invalid="true"` y `aria-describedby` apuntando a su mensaje, y el foco va al primer campo con error (WCAG 3.3.1).

**Resultado obtenido:** se muestra *"Seleccione la hora estimada de llegada."*, pero ningún campo tiene `aria-invalid` ni `aria-describedby`, y el foco queda en el `<body>`.

**Análisis:** es el mismo problema que [DEF-010](#def-010) en el login: la aplicación no tiene un manejo común de errores accesibles en sus formularios.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-012/)

---

## DEF-013

**Quien no puede reservar se entera recién al confirmar**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Media | *Un usuario que no puede reservar es avisado al abrir el formulario* |

**Pasos:** iniciar sesión con `rmamani` (2 de 2 reservas activas) o `sflores` (no-show reciente), abrir el detalle de `H105` y hacer clic en "Reservar".

**Resultado esperado:** al abrir el formulario se avisa que no puede reservar, con el mismo mensaje que la aplicación ya tiene para ese caso.

**Resultado obtenido:** el formulario se abre sin ningún aviso. El usuario elige las fechas y completa todos los datos, y recién al confirmar aparece *"Alcanzó el límite de 2 reservas activas para Huésped."* o *"Tiene una reserva no presentada en los últimos 30 días. No puede reservar por ahora."*

**Nota:** la regla de negocio sí se cumple (la reserva no se crea). El defecto es que la aplicación ya conoce la restricción al abrir el formulario y no la muestra. Prioridad Media porque afecta a todo usuario en el límite o con un no-show, que son casos frecuentes.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-013/)

---

## DEF-014

**Los nombres de persona aceptan números (titular de la reserva y registro)**

| Severidad | Prioridad | Escenarios |
|---|---|---|
| Baja | Baja | *El nombre del titular no acepta números* (inciso 2) · *El nombre del usuario no acepta números* (inciso 3) |

**Pasos:** en el formulario de reserva, cambiar el titular a `Lucia 123`, completar los demás datos y confirmar. En el registro, completar el formulario con el nombre `Ana 123` y crear la cuenta.

**Resultado esperado:** el nombre se rechaza con un error en el campo, porque un nombre de persona no contiene dígitos.

**Resultado obtenido:** la reserva se confirma con el titular `"Lucia 123"` y la cuenta se crea con el nombre `"Ana 123"`.

**Nota:** la única validación de ambos nombres es tener al menos 3 caracteres. No hay un requisito explícito que prohíba los números; se reporta como validación de datos de buena práctica. Es la misma regla que falta en dos formularios, por eso es un solo defecto.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-014/)

---

## DEF-015

**Al volver del detalle se pierden las fechas buscadas**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Media | *Volver del detalle conserva las fechas buscadas* (con "Volver a habitaciones" y con Atrás del navegador) |

**Pasos:** en Habitaciones, buscar fechas (check-in dentro de 30 días, 6 noches), abrir el detalle de `H105` y volver al listado con "← Volver a habitaciones" o con Atrás del navegador.

**Resultado esperado:** el listado conserva las fechas buscadas y su disponibilidad, para poder comparar habitaciones sin buscar de nuevo.

**Resultado obtenido:** los campos Check-in y Check-out quedan vacíos y la columna Disponibilidad vuelve a "Elija fechas". También se pierden al recargar el listado.

**Análisis:** el detalle recibe las fechas en la URL (`/habitaciones/H105?checkIn=…&checkOut=…`), pero el listado no las guarda en la suya (queda en `/habitaciones`), así que al volver no tiene de dónde recuperarlas.

**Prioridad:** Media, porque afecta al recorrido principal de "buscar → ver detalle → comparar" antes de reservar.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-015/)

---

## DEF-016

**Con sesión iniciada se puede abrir el registro y crear cuentas**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Baja | Baja | *Un usuario con sesión iniciada no ve el formulario de registro* |

**Pasos:** iniciar sesión con `lvargas` y navegar a `/registro`.

**Resultado esperado:** igual que con `/login`, un usuario con sesión activa es redirigido a Habitaciones y no ve el formulario de registro.

**Resultado obtenido:** se muestra el formulario "Crear cuenta" con la cabecera de "Lucía Vargas". En la exploración se completó el formulario: la cuenta nueva se creó y la sesión de lvargas siguió activa.

**Nota:** es inconsistente con el login, que sí redirige a quien ya tiene sesión. Permite crear cuentas desde una sesión ajena (por ejemplo, en una computadora compartida).

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-016/)

---

## DEF-017

**Un nombre sin largo máximo rompe la pantalla y oculta "Cerrar sesión"**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Media | Baja | *Un nombre muy largo no rompe la pantalla* |

**Pasos:** registrar un usuario con un nombre de 5000 caracteres e iniciar sesión con él.

**Resultado esperado:** el nombre se rechaza o se limita a un largo razonable, y la cabecera se mantiene dentro de la pantalla.

**Resultado obtenido:** la cuenta se crea con el nombre completo (5000 caracteres). Al ingresar, el nombre se muestra completo en la cabecera: la página mide ~44.400 px de ancho (la ventana, ~1.500 px) y el botón **"Cerrar sesión" queda fuera de la pantalla**. Solo se alcanza desplazándose hacia la derecha.

**Análisis:** el registro valida un mínimo de 3 caracteres para el nombre, pero ningún máximo. El mismo nombre se precarga como titular en el formulario de reserva.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-017/)

---

## DEF-018

**Se acepta una contraseña igual al nombre de usuario**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Media | Media | *La contraseña no puede ser igual al usuario* |

**Pasos:** en el registro, usar el mismo valor como usuario y contraseña (por ejemplo `Pr1mw0abc` / `Pr1mw0abc`, que cumple la política) y crear la cuenta.

**Resultado esperado:** la contraseña se rechaza con un error en el campo, porque es igual al usuario.

**Resultado obtenido:** la cuenta se crea. La única política es "Mínimo 8 caracteres, una mayúscula y un número".

**Nota:** no hay un requisito explícito. Se reporta según buenas prácticas (OWASP): una contraseña igual al usuario es la primera que se prueba en un ataque, y el usuario se muestra públicamente (por ejemplo, en el mensaje "Cuenta creada para …").

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-018/)

---

## Verificado sin defecto

Comprobaciones automatizadas que **pasan** (se ejecutan con `npm test`):

| Prueba | Escenario |
|---|---|
| Inyección SQL (`' OR '1'='1`) rechazada | *Credenciales inválidas (intento de inyección SQL)* |
| XSS en el usuario no ejecuta código | *Un intento de XSS en el usuario no ejecuta código* |
| Mismo mensaje para usuario inexistente y contraseña incorrecta (no revela qué usuarios existen) | *Credenciales inválidas* |
| Usuario bloqueado con contraseña incorrecta recibe el mensaje genérico | *Credenciales inválidas (usuario bloqueado con clave incorrecta)* |
| Entradas de 5000 caracteres se manejan sin errores | *Entradas muy largas se rechazan sin errores* |
| Rutas protegidas redirigen al login sin sesión | *Rutas protegidas redirigen al login sin sesión* |
| `/admin` muestra "Página no encontrada" | *Una ruta inexistente muestra la página de no encontrado* |
| No hay Service Workers, Cache Storage ni cookies; `Cache-Control: max-age=0, must-revalidate` | *La aplicación no usa caché del navegador ni cookies* |
| El logout elimina la sesión del almacenamiento | *Cerrar sesión elimina la sesión del almacenamiento del navegador* |
| "Atrás" después del login no vuelve al login | *Volver atrás después de iniciar sesión no regresa al login* |

**Inciso 2: reserva**

| Prueba | Escenario |
|---|---|
| La reserva de 6 noches se confirma y aparece correctamente en Mis reservas (lvargas, dchoque y admin) | *Reservar una habitación por 6 noches* · *La reserva creada aparece en Mis reservas* |
| Solo se pueden elegir de 1 a 14 noches; el mismo día no crea una estadía de 0 noches | *Rango de noches* |
| Check-in solo entre mañana y dentro de 180 días; las fechas reservadas y los rangos que las cruzan se bloquean | *Fechas permitidas* |
| Hora de llegada, política, titular, correo `.test` y solicitudes (máx. 200) se validan con su mensaje | *Campos obligatorios y validaciones* |
| Total = tarifa × noches, con separador de miles, igual en el formulario y en Mis reservas | *El total es la tarifa por la cantidad de noches* |
| El total lo calcula la aplicación aunque se envíe otro valor | *El total lo calcula la aplicación aunque se envíe otro valor* |
| Las reglas de noches, fechas, capacidad y fechas ocupadas se validan también fuera del formulario | *Las reglas de la reserva se validan también fuera del formulario* |
| Límite de reservas activas según el tipo de usuario: Huésped 2, Corporativo 6; Frecuente 4 (sflores no llega a reservar por el no-show) | *No se puede superar el límite de reservas activas* |
| Varios clics seguidos en Confirmar crean una sola reserva | *Varios clics seguidos en Confirmar crean una sola reserva* |
| Desde dos pestañas no se supera el límite ni se reservan las mismas fechas | *No se puede superar el límite reservando desde dos pestañas* · *No se pueden reservar las mismas fechas desde dos pestañas* |
| XSS en el titular y en las solicitudes especiales no ejecuta código | *Un intento de XSS en los datos de la reserva no ejecuta código* |
| Un `userId` ajeno se ignora: la reserva se crea a nombre del usuario con sesión | *La reserva se crea siempre a nombre del usuario con sesión* |
| No se puede cancelar ni modificar la reserva de otro usuario | *No se puede operar sobre la reserva de otro usuario* |
| "Reservar" desde el listado aplica las mismas reglas y la reserva aparece en Mis reservas | *Reservar 6 noches desde el botón Reservar del listado* |
| La búsqueda por fechas muestra la disponibilidad en el listado y en el detalle (botón deshabilitado si no está disponible); "Limpiar fechas" la quita | *El detalle muestra que la habitación está / no está disponible…* · *Limpiar las fechas de búsqueda…* |
| El formulario se abre con las fechas buscadas, desde el detalle y desde el listado | *El formulario se abre con las fechas buscadas* |
| Con varios huéspedes el total no cambia (tarifa por habitación) y Mis reservas muestra la cantidad | *Reservar 6 noches para varios huéspedes* |
| El calendario no permite ir antes del mes actual ni después del mes del día 180 | *Navegación del calendario dentro del rango permitido* |

**Inciso 3: registro y usuario nuevo**

| Prueba | Escenario |
|---|---|
| El registro de cada tipo (Huésped, Frecuente, Corporativo) crea la cuenta, lleva al login y no inicia sesión automáticamente | *Registrarse como usuario …* |
| El usuario nuevo se guarda con rol `huesped`, estado `activo`, el tipo elegido, un id propio y nombre y correo sin espacios alrededor | *El registro guarda los datos correctos del usuario nuevo* |
| No se puede elegir un rol o tipo que el formulario no ofrece (admin, VIP inyectados desde DevTools) | *No se puede registrar con un tipo de usuario no ofrecido* |
| Dos registros simultáneos reciben ids distintos; el mismo usuario no se registra dos veces desde dos pestañas | *Dos registros simultáneos…* · *El mismo usuario no se registra dos veces…* |
| Todas las validaciones del formulario muestran su mensaje y no crean la cuenta; se aceptan los valores límite | *Validación de los datos del registro* · *Política de contraseña* · *Se aceptan los valores límite* |
| No se puede registrar el usuario ni el correo de los 6 usuarios sembrados (exacto, en mayúsculas y con espacios) ni de un usuario recién creado | *No se puede registrar el usuario ni el correo de un usuario existente* · *No se duplica un usuario recién registrado* |
| XSS en el nombre no se ejecuta en la cabecera, la bienvenida ni el titular de la reserva | *Un intento de XSS en el nombre no ejecuta código* |
| Primer ingreso: nombre en la cabecera, bienvenida, Mis reservas vacía y límite según el tipo | *Primer ingreso de un usuario …* |
| Reserva de 2 noches: titular del usuario nuevo, total 2 × tarifa (Bs 700), fila correcta en Mis reservas; persiste al recargar y al volver a ingresar | *Registrarse y reservar una habitación por 2 noches* · *El usuario nuevo y su reserva persisten…* |
| Límite del usuario registrado según su tipo (2, 4, 6); el Frecuente nuevo no hereda el no-show de sflores | *Límite de reservas activas del usuario registrado* |
| El usuario nuevo no puede reservar fechas ya reservadas por otro usuario (calendario y lógica de la app) | *El usuario nuevo no puede reservar fechas ya reservadas por otro usuario* |
| Aislamiento: el nuevo no ve reservas ajenas y los 5 usuarios activos no ven la suya | *El usuario nuevo no ve reservas de otros usuarios* · *Un usuario existente no ve la reserva del usuario nuevo* |
| Registrar y reservar no altera los usuarios ni las reservas existentes (incluido ptorrez) | *Registrar un usuario y reservar no altera los datos de los usuarios existentes* |
