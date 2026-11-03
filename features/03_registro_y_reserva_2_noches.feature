Feature: Registro de usuario y reserva por 2 noches
  Como visitante nuevo
  Quiero registrarme, ver el detalle de una habitación y reservarla
  Para asegurar mi estadía de 2 noches

  # Cada escenario describe el comportamiento esperado del registro y de lo que
  # cambia por ser un usuario recién creado. Cada escenario registra su propio
  # usuario desde la interfaz con datos únicos (nunca usa ni modifica a mano los
  # usuarios sembrados), así los escenarios son independientes entre sí.
  # Lo que ya prueban otros incisos (login, sesión, reglas del formulario de
  # reserva, modificar y cancelar) no se repite aquí.
  # El tag @bug marca los escenarios cuyo comportamiento esperado la aplicación
  # no cumple actualmente; @issue enlaza con el defecto en docs/REPORTE_DEFECTOS.md.

  # ---------- Navegación al registro ----------

  Scenario: Ir al registro desde el login y volver
    Given que estoy en la página de login
    When voy al registro desde el login
    Then debería estar en la ruta "/registro"
    And debería ver el formulario de registro
    When vuelvo al login desde el registro
    Then debería permanecer en la página de login

  @bug @severity=minor @issue=DEF-016
  Scenario: Un usuario con sesión iniciada no ve el formulario de registro
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When navego a la ruta "/registro"
    Then debería ingresar a la página de habitaciones

  # ---------- Registro exitoso y datos guardados ----------

  @smoke
  Scenario Outline: Registrarse como usuario <tipo>
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "<tipo>"
    And envío el registro
    Then debería ver que la cuenta del usuario nuevo fue creada
    And debería estar en la página de login sin sesión iniciada

    Examples:
      | tipo        |
      | Huésped     |
      | Frecuente   |
      | Corporativo |

  # Los espacios van dentro de las comillas porque Gherkin recorta las celdas de Examples
  @security
  Scenario: El registro guarda los datos correctos del usuario nuevo
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Corporativo"
    And cambio el campo de registro "Nombre completo" a "   Ana Prueba   "
    And envío el registro
    Then debería ver que la cuenta del usuario nuevo fue creada
    And el usuario nuevo debería guardarse con rol "huesped", estado "activo" y tipo "Corporativo"
    And el usuario nuevo debería tener un identificador que no usa ningún otro usuario
    And el nombre y el correo del usuario nuevo deberían guardarse sin espacios alrededor

  @security @bug @severity=blocker @issue=DEF-003
  Scenario: La contraseña del usuario nuevo no se guarda legible
    Given me registro como un usuario "Huésped"
    Then la contraseña del usuario nuevo no debería guardarse legible

  @security
  Scenario Outline: No se puede registrar con un tipo de usuario no ofrecido (<tipo>)
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And agrego al formulario de registro el tipo de usuario "<tipo>"
    And cambio el campo de registro "Tipo de usuario" a "<tipo>"
    And envío el registro
    Then debería ver el error de registro "Seleccione un tipo de usuario." en el campo "Tipo de usuario"
    And la cuenta no debería crearse

    Examples:
      | tipo  |
      | admin |
      | VIP   |

  @security
  Scenario: Dos registros simultáneos reciben identificadores distintos
    Given que estoy en la página de registro
    And abro el registro en una nueva pestaña
    When cambio a la pestaña 1
    And completo el registro con datos válidos de tipo "Huésped"
    And cambio a la pestaña 2
    And completo el registro con datos válidos de tipo "Huésped"
    And cambio a la pestaña 1
    And envío el registro
    And cambio a la pestaña 2
    And envío el registro
    Then debería ver que la cuenta del usuario nuevo fue creada
    And los dos usuarios deberían guardarse con identificadores distintos

  @security
  Scenario: El mismo usuario no se registra dos veces desde dos pestañas
    Given que estoy en la página de registro
    And abro el registro en una nueva pestaña
    When cambio a la pestaña 1
    And completo el registro con datos válidos de tipo "Huésped"
    And cambio a la pestaña 2
    And completo el registro con el mismo usuario de la pestaña 1 y otro correo
    And cambio a la pestaña 1
    And envío el registro
    And cambio a la pestaña 2
    And envío el registro
    Then debería ver el error de registro "El usuario ya existe." en el campo "Usuario"
    And la cuenta no debería crearse

  # ---------- Validaciones del formulario ----------

  @negative
  Scenario: Enviar el formulario vacío marca todos los campos obligatorios
    Given que estoy en la página de registro
    When envío el registro
    Then debería ver el error de registro "El nombre debe tener al menos 3 caracteres." en el campo "Nombre completo"
    And debería ver el error de registro "Ingrese un correo ficticio con dominio .test (ej. ana@correo.test)." en el campo "Correo"
    And debería ver el error de registro "El usuario debe tener entre 4 y 20 caracteres alfanuméricos." en el campo "Usuario"
    And debería ver el error de registro "Mínimo 8 caracteres, una mayúscula y un número." en el campo "Contraseña"
    And debería ver el error de registro "Seleccione un tipo de usuario." en el campo "Tipo de usuario"
    And debería ver el error de registro "Debe aceptar los términos y condiciones." en el campo "Términos"
    And debería ver el error general del registro "Revise los campos marcados."
    And la cuenta no debería crearse

  @negative
  Scenario Outline: Validación de los datos del registro (<caso>)
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio el campo de registro "<campo>" a "<valor>"
    And envío el registro
    Then debería ver el error de registro "<mensaje>" en el campo "<campo>"
    And debería ver el error general del registro "Revise los campos marcados."
    And la cuenta no debería crearse

    Examples:
      | caso                    | campo                | valor           | mensaje                                                             |
      | nombre vacío            | Nombre completo      |                 | El nombre debe tener al menos 3 caracteres.                         |
      | nombre de 2 caracteres  | Nombre completo      | Ab              | El nombre debe tener al menos 3 caracteres.                         |
      | correo vacío            | Correo               |                 | Ingrese un correo ficticio con dominio .test (ej. ana@correo.test). |
      | correo con dominio real | Correo               | ana@gmail.com   | Ingrese un correo ficticio con dominio .test (ej. ana@correo.test). |
      | correo sin arroba       | Correo               | ana.correo.test | Ingrese un correo ficticio con dominio .test (ej. ana@correo.test). |
      | usuario de 3 caracteres | Usuario              | abc             | El usuario debe tener entre 4 y 20 caracteres alfanuméricos.        |
      | usuario con espacio     | Usuario              | ana prueba      | El usuario debe tener entre 4 y 20 caracteres alfanuméricos.        |
      | usuario con guion bajo  | Usuario              | ana_prueba      | El usuario debe tener entre 4 y 20 caracteres alfanuméricos.        |
      | usuario con ñ           | Usuario              | peñaloza        | El usuario debe tener entre 4 y 20 caracteres alfanuméricos.        |
      | confirmación distinta   | Confirmar contraseña | Clave124!       | Las contraseñas no coinciden.                                       |
      | confirmación vacía      | Confirmar contraseña |                 | Las contraseñas no coinciden.                                       |
      | sin tipo de usuario     | Tipo de usuario      |                 | Seleccione un tipo de usuario.                                      |
      | sin aceptar términos    | Términos             | no              | Debe aceptar los términos y condiciones.                            |

  @negative
  Scenario: Un nombre con solo espacios se trata como vacío
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio el campo de registro "Nombre completo" a "     "
    And envío el registro
    Then debería ver el error de registro "El nombre debe tener al menos 3 caracteres." en el campo "Nombre completo"
    And la cuenta no debería crearse

  @negative
  Scenario: El usuario admite como máximo 20 caracteres
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio el campo de registro "Usuario" a un texto de 21 caracteres
    And envío el registro
    Then debería ver el error de registro "El usuario debe tener entre 4 y 20 caracteres alfanuméricos." en el campo "Usuario"
    And la cuenta no debería crearse

  @negative
  Scenario Outline: Política de contraseña (<caso>)
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio la contraseña y su confirmación a "<clave>"
    And envío el registro
    Then debería ver el error de registro "Mínimo 8 caracteres, una mayúscula y un número." en el campo "Contraseña"
    And la cuenta no debería crearse

    Examples:
      | caso           | clave      |
      | 7 caracteres   | Clave12    |
      | sin mayúscula  | clave1234  |
      | sin número     | ClaveClave |

  @negative @security @bug @severity=normal @issue=DEF-018
  Scenario: La contraseña no puede ser igual al usuario
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And uso el mismo valor como usuario y contraseña
    And envío el registro
    Then debería ver un error de registro en el campo "Contraseña"
    And la cuenta no debería crearse

  Scenario Outline: Se aceptan los valores límite (<caso>)
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio el campo de registro "<campo>" a un texto de <largo> caracteres
    And envío el registro
    Then debería ver que la cuenta del usuario nuevo fue creada

    Examples:
      | caso                      | campo           | largo |
      | nombre de 3 caracteres    | Nombre completo | 3     |
      | usuario de 4 caracteres   | Usuario         | 4     |
      | usuario de 20 caracteres  | Usuario         | 20    |

  Scenario: Se acepta una contraseña con solo mayúsculas y números
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio la contraseña y su confirmación a "CLAVE1234"
    And envío el registro
    Then debería ver que la cuenta del usuario nuevo fue creada

  @negative @bug @severity=minor @issue=DEF-014
  Scenario: El nombre del usuario no acepta números
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio el campo de registro "Nombre completo" a "Ana 123"
    And envío el registro
    Then debería ver un error de registro en el campo "Nombre completo"
    And la cuenta no debería crearse

  @bug @severity=normal @issue=DEF-017
  Scenario: Un nombre muy largo no rompe la pantalla
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio el campo de registro "Nombre completo" a un texto de 5000 caracteres
    And envío el registro
    And inicio sesión con el usuario nuevo
    Then la página no debería desplazarse horizontalmente
    And el botón Cerrar sesión debería estar visible en la pantalla

  @security
  Scenario: Un intento de XSS en el nombre no ejecuta código
    Given que estoy en la página de registro
    When completo el registro con datos válidos de tipo "Huésped"
    And cambio el campo de registro "Nombre completo" a "<img src=x onerror=window.__xss=1>"
    And envío el registro
    And inicio sesión con el usuario nuevo
    Then debería ver el nombre del usuario nuevo en la cabecera
    And debería ver la bienvenida del usuario nuevo
    And no debería ejecutarse el código inyectado
    Given estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then el titular de la reserva debería ser el usuario nuevo
    And no debería ejecutarse el código inyectado

  @accessibility @bug @severity=minor @issue=DEF-010
  Scenario: Los errores del registro se marcan de forma accesible
    Given que estoy en la página de registro
    When envío el registro
    Then el campo de registro "Nombre completo" debería estar marcado como inválido
    And el foco debería estar en el campo de registro "Nombre completo"

  # ---------- Duplicados ----------

  @negative @security
  Scenario Outline: No se puede registrar el usuario ni el correo de un usuario existente (<usuario>)
    Given que estoy en la página de registro
    Then no debería poder registrarse con el usuario de "<usuario>" exacto, en mayúsculas ni con espacios
    And no debería poder registrarse con el correo de "<usuario>" exacto, en mayúsculas ni con espacios

    Examples:
      | usuario |
      | lvargas |
      | rmamani |
      | sflores |
      | dchoque |
      | ptorrez |
      | admin   |

  @negative
  Scenario: No se duplica un usuario recién registrado
    Given me registro como un usuario "Huésped"
    Then no debería poder registrarse con el usuario y el correo del usuario nuevo en mayúsculas

  # ---------- Primer ingreso ----------

  @smoke
  Scenario Outline: Primer ingreso de un usuario <tipo>
    Given me registro como un usuario "<tipo>"
    When inicio sesión con el usuario nuevo
    Then debería ingresar a la página de habitaciones
    And debería ver el nombre del usuario nuevo en la cabecera
    And debería ver la bienvenida del usuario nuevo
    When voy a "Mis reservas" desde el menú
    Then debería ver "Reservas activas: 0 de <limite>" en Mis reservas
    And no debería tener reservas en Mis reservas

    Examples:
      | tipo        | limite |
      | Huésped     | 2      |
      | Frecuente   | 4      |
      | Corporativo | 6      |

  # ---------- Reserva de 2 noches del usuario nuevo ----------

  @smoke
  Scenario: Registrarse y reservar una habitación por 2 noches
    Given me registré e inicié sesión como un usuario "Huésped"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then el titular de la reserva debería ser el usuario nuevo
    When elijo un check-in dentro de 30 días por 2 noches
    Then el resumen debería mostrar "2 noches" y un total de "Bs 700"
    When completo la hora de llegada y acepto la política de cancelación
    And confirmo la reserva
    Then debería ver la confirmación de la reserva
    When voy a "Mis reservas" desde el menú
    Then debería ver la reserva con habitación "H105 · Doble", 2 noches, 1 huésped y total "Bs 700"
    And la reserva debería estar "Confirmada" con modificaciones "0/1"
    And debería ver "Reservas activas: 1 de 2" en Mis reservas

  Scenario: El usuario nuevo y su reserva persisten al recargar y al volver a ingresar
    Given me registré e inicié sesión como un usuario "Huésped"
    And reservé la habitación "H105" por 2 noches con check-in dentro de 30 días
    When voy a "Mis reservas" desde el menú
    And recargo la página
    Then debería ver la reserva con habitación "H105 · Doble", 2 noches, 1 huésped y total "Bs 700"
    When cierro sesión
    And inicio sesión con el usuario nuevo
    And voy a "Mis reservas" desde el menú
    Then debería ver la reserva con habitación "H105 · Doble", 2 noches, 1 huésped y total "Bs 700"

  # El Frecuente nuevo no hereda la restricción por no-show de sflores
  Scenario Outline: Límite de reservas activas del usuario registrado (<tipo>)
    Given me registré e inicié sesión como un usuario "<tipo>"
    And completé mis reservas activas hasta el límite
    When intento reservar la habitación "H105" por 2 noches con check-in dentro de 30 días
    Then debería ver el error de la reserva "Alcanzó el límite de <limite> reservas activas para <tipo>."
    And la reserva no debería crearse

    Examples:
      | tipo        | limite |
      | Huésped     | 2      |
      | Frecuente   | 4      |
      | Corporativo | 6      |

  @security
  Scenario: El usuario nuevo no puede reservar fechas ya reservadas por otro usuario
    Given me registré e inicié sesión como un usuario "Huésped"
    And estoy en el detalle de la habitación reservada por "lvargas"
    When abro el formulario de reserva
    Then las noches reservadas por "lvargas" deberían estar deshabilitadas en el calendario
    When solicito a la aplicación una reserva en las fechas reservadas por "lvargas"
    Then la aplicación debería rechazarla con "La habitación ya está reservada en parte de esas fechas."

  # ---------- Aislamiento e integridad de los datos ----------

  @security
  Scenario: El usuario nuevo no ve reservas de otros usuarios
    Given me registré e inicié sesión como un usuario "Huésped"
    When voy a "Mis reservas" desde el menú
    Then no debería tener reservas en Mis reservas
    When consulto a la aplicación mis reservas
    Then la aplicación no debería devolver reservas

  @security
  Scenario Outline: Un usuario existente no ve la reserva del usuario nuevo (<usuario>)
    Given me registré e inicié sesión como un usuario "Huésped"
    And reservé la habitación "H105" por 2 noches con check-in dentro de 30 días
    And cierro sesión
    When inicio sesión con usuario "<usuario>" y contraseña "<password>"
    And voy a "Mis reservas" desde el menú
    Then no debería ver la reserva del usuario nuevo en Mis reservas

    Examples:
      | usuario | password    |
      | lvargas | Huesped123! |
      | rmamani | Huesped123! |
      | sflores | Huesped123! |
      | dchoque | Huesped123! |
      | admin   | Admin123!   |

  @security
  Scenario: Registrar un usuario y reservar no altera los datos de los usuarios existentes
    Given guardo los datos de los usuarios y reservas existentes
    And me registré e inicié sesión como un usuario "Corporativo"
    And reservé la habitación "H105" por 2 noches con check-in dentro de 30 días
    Then los usuarios y las reservas existentes no deberían cambiar
