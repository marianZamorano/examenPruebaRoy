Feature: Inicio de sesión
  Como huésped del hotel
  Quiero iniciar sesión con mi usuario y contraseña
  Para acceder al sistema de reservas

  # Cada escenario describe el comportamiento esperado del login.
  # El tag @bug marca los escenarios cuyo comportamiento esperado la aplicación
  # no cumple actualmente; @issue enlaza con el defecto en docs/REPORTE_DEFECTOS.md.
  # Cuando el defecto se corrige, se quitan esos tags.

  Background:
    Given que estoy en la página de login

  # ---------- Inicio de sesión exitoso ----------

  @smoke
  Scenario Outline: Login exitoso con un usuario activo (<usuario>)
    When inicio sesión con usuario "<usuario>" y contraseña "<password>"
    Then debería ingresar a la página de habitaciones
    And debería ver el nombre "<nombre>" en la cabecera
    And debería ver el mensaje "Bienvenido, <nombre>"

    Examples:
      | usuario | password    | nombre         |
      | lvargas | Huesped123! | Lucía Vargas   |
      | rmamani | Huesped123! | Rodrigo Mamani |
      | sflores | Huesped123! | Sofía Flores   |
      | dchoque | Huesped123! | Daniel Choque  |
      | admin   | Admin123!   | Ana Admin      |

  Scenario: Login exitoso presionando la tecla Enter
    When inicio sesión con usuario "lvargas" y contraseña "Huesped123!" presionando Enter
    Then debería ingresar a la página de habitaciones

  # Los espacios van dentro de las comillas porque Gherkin recorta las celdas de Examples
  Scenario: El nombre de usuario no distingue mayúsculas
    When inicio sesión con usuario "LVARGAS" y contraseña "Huesped123!"
    Then debería ingresar a la página de habitaciones
    And debería ver el nombre "Lucía Vargas" en la cabecera

  Scenario: Se ignoran los espacios al inicio y al final del usuario
    When inicio sesión con usuario "  lvargas  " y contraseña "Huesped123!"
    Then debería ingresar a la página de habitaciones
    And debería ver el nombre "Lucía Vargas" en la cabecera

  # ---------- Validación de credenciales ----------

  @negative
  Scenario: Usuario bloqueado no puede ingresar
    When inicio sesión con usuario "ptorrez" y contraseña "Huesped123!"
    Then debería ver el mensaje de error "Usuario bloqueado. Contacte a recepción."
    And debería permanecer en la página de login

  @negative
  Scenario Outline: Credenciales inválidas (<caso>)
    When inicio sesión con usuario "<usuario>" y contraseña "<password>"
    Then debería ver el mensaje de error "Usuario o contraseña incorrectos."
    And debería permanecer en la página de login

    Examples:
      | caso                                   | usuario            | password    |
      | contraseña incorrecta                  | lvargas            | incorrecta  |
      | contraseña distingue mayúsculas        | lvargas            | huesped123! |
      | usuario inexistente                    | noexiste           | Huesped123! |
      | correo en lugar de usuario             | lvargas@hotel.test | Huesped123! |
      | contraseña de otro usuario             | admin              | Huesped123! |
      | usuario bloqueado con clave incorrecta | ptorrez            | incorrecta  |
      | intento de inyección SQL               | ' OR '1'='1        | ' OR '1'='1 |

  @negative
  Scenario: La contraseña no se recorta (espacio al final)
    When inicio sesión con usuario "lvargas" y contraseña "Huesped123! "
    Then debería ver el mensaje de error "Usuario o contraseña incorrectos."
    And debería permanecer en la página de login

  @negative
  Scenario Outline: Campos obligatorios (<caso>)
    When inicio sesión con usuario "<usuario>" y contraseña "<password>"
    Then debería ver el mensaje de error "Ingrese usuario y contraseña."
    And debería permanecer en la página de login

    Examples:
      | caso             | usuario | password    |
      | ambos vacíos     |         |             |
      | usuario vacío    |         | Huesped123! |
      | contraseña vacía | lvargas |             |

  @negative
  Scenario: Campos con solo espacios se tratan como vacíos
    When inicio sesión con usuario "   " y contraseña "   "
    Then debería ver el mensaje de error "Ingrese usuario y contraseña."
    And debería permanecer en la página de login

  @negative
  Scenario: Entradas muy largas se rechazan sin errores
    When inicio sesión con un usuario y una contraseña de 5000 caracteres
    Then debería ver el mensaje de error "Usuario o contraseña incorrectos."
    And debería permanecer en la página de login

  # ---------- Seguridad del formulario y de las credenciales ----------

  @security
  Scenario: La contraseña se muestra enmascarada
    Then el campo contraseña debería estar enmascarado

  @security
  Scenario: Un intento de XSS en el usuario no ejecuta código
    When inicio sesión con usuario "<img src=x onerror=window.__xss=1>" y contraseña "x"
    Then debería ver el mensaje de error "Usuario o contraseña incorrectos."
    And no debería ejecutarse el código inyectado

  @security @bug @severity=normal @issue=DEF-005
  Scenario: La cuenta se protege tras varios intentos fallidos
    When inicio sesión 8 veces con usuario "lvargas" y una contraseña incorrecta
    And inicio sesión con usuario "lvargas" y contraseña "Huesped123!"
    Then debería permanecer en la página de login

  @security @bug @severity=blocker @issue=DEF-003
  Scenario: Las contraseñas no se guardan legibles en el navegador
    When inspecciono el almacenamiento del navegador
    Then el almacenamiento del navegador no debería contener la contraseña "Huesped123!"

  # ---------- Control de acceso ----------

  @security
  Scenario Outline: Rutas protegidas redirigen al login sin sesión (<ruta>)
    When navego a la ruta "<ruta>"
    Then debería permanecer en la página de login

    Examples:
      | ruta               |
      | /habitaciones      |
      | /habitaciones/H101 |
      | /mis-reservas      |

  @security
  Scenario: Una ruta inexistente muestra la página de no encontrado
    When navego a la ruta "/admin"
    Then debería ver el mensaje de página no encontrada

  @bug @severity=minor @issue=DEF-008
  Scenario: Después del login se vuelve a la página solicitada
    When navego a la ruta "/mis-reservas"
    And inicio sesión con usuario "lvargas" y contraseña "Huesped123!"
    Then debería estar en la ruta "/mis-reservas"

  # ---------- Manejo de la sesión ----------

  Scenario: La sesión se mantiene al recargar la página
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When recargo la página
    Then debería ingresar a la página de habitaciones
    And debería ver el nombre "Lucía Vargas" en la cabecera

  Scenario: Un usuario con sesión activa no vuelve a ver el login
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When navego a la ruta "/login"
    Then debería ingresar a la página de habitaciones

  Scenario: Volver atrás después de iniciar sesión no regresa al login
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When vuelvo a la página anterior del navegador
    Then debería ingresar a la página de habitaciones

  @security
  Scenario: Cerrar sesión elimina la sesión del almacenamiento del navegador
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When cierro sesión
    And inspecciono el almacenamiento del navegador
    Then la sesión no debería existir en el almacenamiento del navegador

  @security @cache @bug @severity=critical @issue=BUG-001
  Scenario: Tras cerrar sesión, volver atrás no muestra datos del usuario
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And navego a la ruta "/mis-reservas"
    When cierro sesión
    And vuelvo a la página anterior del navegador
    And voy a "Mis reservas" desde el menú
    And inspecciono el almacenamiento del navegador
    Then la sesión no debería existir en el almacenamiento del navegador
    And debería permanecer en la página de login

  @security @bug @severity=critical @issue=BUG-003
  Scenario: Cerrar sesión en una pestaña cierra la sesión en las demás
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And abro la aplicación en una nueva pestaña
    When cambio a la pestaña 1
    And cierro sesión
    And cambio a la pestaña 2
    And voy a "Mis reservas" desde el menú
    And inspecciono el almacenamiento del navegador
    Then la sesión no debería existir en el almacenamiento del navegador
    And debería permanecer en la página de login

  @security @bug @severity=critical @issue=BUG-002
  Scenario: Un usuario bloqueado durante su sesión debería perder el acceso
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And el usuario "lvargas" es bloqueado por recepción
    When recargo la página
    And inspecciono el almacenamiento del navegador
    Then el usuario "lvargas" debería figurar como "bloqueado" en el almacenamiento
    And debería permanecer en la página de login

  @security @bug @severity=blocker @issue=DEF-004
  Scenario: No se puede suplantar una sesión editando el almacenamiento
    When establezco la sesión "U001" en el almacenamiento del navegador
    And recargo la página
    And inspecciono el almacenamiento del navegador
    Then debería permanecer en la página de login

  @security @bug @severity=normal @issue=DEF-007
  Scenario: La sesión almacenada tiene fecha de expiración
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When inspecciono el almacenamiento del navegador
    Then la sesión almacenada debería tener una fecha de expiración

  # ---------- Caché del navegador ----------

  @security @cache
  Scenario: La aplicación no usa caché del navegador ni cookies
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When inspecciono el almacenamiento del navegador
    Then la aplicación no debería usar Service Workers, Cache Storage ni cookies
    And el documento no debería guardarse en la caché HTTP

  # ---------- Usabilidad y accesibilidad ----------

  @bug @severity=minor @issue=DEF-006
  Scenario: El mensaje de error desaparece al corregir los datos
    When inicio sesión con usuario "" y contraseña ""
    And escribo "lvargas" en el campo usuario
    Then no debería ver el mensaje de error

  @bug @severity=normal @issue=DEF-009
  Scenario: Restablecer datos pide confirmación
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When hago clic en "Restablecer datos" del pie de página
    Then debería ver una solicitud de confirmación

  @accessibility @bug @severity=minor @issue=DEF-010
  Scenario: Los errores del formulario se marcan de forma accesible
    When inicio sesión con usuario "" y contraseña ""
    Then el campo usuario debería estar marcado como inválido
    And el foco debería estar en el campo usuario
