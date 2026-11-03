# Reporte de defectos — Hotel QA

| | |
|---|---|
| **Aplicación** | [Hotel QA](https://hotel-qa-f51.pages.dev/) |
| **Módulo evaluado** | Inicio de sesión y manejo de sesión (Inciso 1) |
| **Fecha** | 03/11/2026 |
| **Entorno** | Windows 11 · Google Chrome 156 · WebdriverIO 10 · Cucumber · Allure |
| **Datos de prueba** | Usuarios de prueba publicados en la pantalla de login |

Todos los defectos se detectaron **ejecutando la suite automatizada**. Cada uno tiene un escenario
Cucumber con el tag `@bug` en [`features/01_login.feature`](../features/01_login.feature), que falla
en el paso que demuestra el defecto.

## Cómo reproducir y generar la evidencia

```bash
npm run clean             # borra resultados anteriores (el historial se conserva)
npm run test:evidencias   # escenarios @bug con DevTools abierto; regenera docs/evidencias/
npm run report            # reporte de Allure con historial de ejecuciones
```

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
| [DEF-003](#def-003) | Contraseñas almacenadas en texto plano en el navegador | Defecto de diseño · Seguridad | Crítica | Media |
| [DEF-004](#def-004) | La sesión puede suplantarse editando el almacenamiento | Defecto de diseño · Seguridad | Crítica | Media |
| [DEF-005](#def-005) | Sin límite de intentos fallidos de inicio de sesión | Defecto de diseño · Seguridad | Media | Media |
| [DEF-007](#def-007) | La sesión no expira | Defecto de diseño · Seguridad | Media | Media |
| [DEF-009](#def-009) | "Restablecer datos" se ejecuta sin pedir confirmación | Bug · Usabilidad | Media | Baja |
| [DEF-006](#def-006) | El mensaje de error no se limpia al corregir los datos | Bug · Usabilidad | Baja | Baja |
| [DEF-008](#def-008) | Después del login no se vuelve a la página solicitada | Defecto de diseño · Usabilidad | Baja | Baja |
| [DEF-010](#def-010) | El formulario no marca de forma accesible los errores | Defecto de diseño · Accesibilidad | Baja | Baja |

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

## DEF-003

**Contraseñas almacenadas en texto plano en el navegador**

| Severidad | Prioridad | Escenario |
|---|---|---|
| Crítica | Media | *Las contraseñas no se guardan legibles en el navegador* |

**Pasos:** abrir la aplicación (sin iniciar sesión) e inspeccionar el almacenamiento del navegador.

**Resultado esperado:** las contraseñas no son accesibles desde el cliente, o están protegidas con un hash.

**Resultado obtenido:** `localStorage["hotel-qa:db"]` contiene todos los usuarios con su contraseña legible (por ejemplo, `admin` / `Admin123!`).

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
| Baja | Baja | *Los errores del formulario se marcan de forma accesible* |

**Pasos:** enviar el formulario vacío e inspeccionar los campos.

**Resultado esperado:** los campos con error tienen `aria-invalid="true"` y `aria-describedby` apuntando al mensaje, y el foco va al primer campo con error (WCAG 3.3.1).

**Resultado obtenido:** `aria-invalid` y `aria-describedby` son `null` en ambos campos.

**Aspectos correctos:** el mensaje de error tiene `role="alert"` y los campos tienen su `<label>`.

**Evidencia:** [capturas de cada paso con DevTools y video](evidencias/DEF-010/)

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
