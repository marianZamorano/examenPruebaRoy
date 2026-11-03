Feature: Reserva de habitación por 6 noches
  Como huésped registrado
  Quiero ver el detalle de una habitación y reservarla
  Para asegurar mi estadía de 6 noches

  # Cada escenario describe el comportamiento esperado de la reserva.
  # Las fechas son siempre relativas a hoy ("dentro de N días"), nunca fijas.
  # El tag @bug marca los escenarios cuyo comportamiento esperado la aplicación
  # no cumple actualmente; @issue enlaza con el defecto en docs/REPORTE_DEFECTOS.md.

  # ---------- Ingreso y detalle de la habitación ----------

  @smoke
  Scenario: Ingresar y ver el listado de habitaciones
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    Then debería ver el listado con "24 habitación(es)"

  @smoke
  Scenario Outline: Ver el detalle de una habitación desde el listado (<habitacion>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When abro el detalle de la habitación "<habitacion>" desde el listado
    Then debería estar en la ruta "/habitaciones/<habitacion>"
    And debería ver el detalle de la habitación "<habitacion>" con tipo "<tipo>", capacidad "<capacidad>", tarifa "<tarifa>", piso "<piso>" y vista "<vista>"
    And debería ver los servicios "<servicios>"

    Examples:
      | habitacion | tipo     | capacidad  | tarifa   | piso | vista      | servicios                                                                         |
      | H105       | Doble    | 2 personas | Bs 350   | 1    | Piscina    | Wi-Fi, TV, Baño privado, Aire acondicionado                                       |
      | H106       | Familiar | 4 personas | Bs 480   | 1    | Jardín     | Wi-Fi, TV, Baño privado, Aire acondicionado, Minibar, Cocineta                    |
      | H402       | Suite    | 3 personas | Bs 1.200 | 4    | Panorámica | Wi-Fi, TV, Baño privado, Aire acondicionado, Minibar, Jacuzzi, Sala de estar, Balcón |

  Scenario: Volver al listado desde el detalle
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When vuelvo al listado de habitaciones
    Then debería ver el listado con "24 habitación(es)"

  Scenario: El formulario de reserva muestra la habitación y las reglas de la reserva
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then el formulario debería mostrar "H105 · Doble · Bs 350 por noche"
    And el formulario debería indicar check-in entre mañana y dentro de 180 días, de 1 a 14 noches
    And el botón Confirmar reserva debería estar "deshabilitado"

  Scenario Outline: El titular y el correo se completan con los datos del usuario (<usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then el titular debería ser "<nombre>" y el correo "<correo>"

    Examples:
      | usuario | password    | nombre         | correo             |
      | lvargas | Huesped123! | Lucía Vargas   | lvargas@hotel.test |
      | rmamani | Huesped123! | Rodrigo Mamani | rmamani@hotel.test |
      | sflores | Huesped123! | Sofía Flores   | sflores@hotel.test |
      | dchoque | Huesped123! | Daniel Choque  | dchoque@hotel.test |
      | admin   | Admin123!   | Ana Admin      | admin@hotel.test   |

  # ---------- Reserva de 6 noches ----------

  @smoke
  Scenario Outline: Reservar una habitación por 6 noches (<usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    Then el resumen debería mostrar "6 noches" y un total de "Bs 2.100"
    When completo la hora de llegada y acepto la política de cancelación
    And confirmo la reserva
    Then debería ver la confirmación de la reserva
    And el formulario de reserva debería cerrarse
    And las fechas reservadas deberían figurar como ocupadas en el detalle

    Examples:
      | usuario | password    |
      | lvargas | Huesped123! |
      | dchoque | Huesped123! |
      | admin   | Admin123!   |

  @smoke
  Scenario Outline: La reserva creada aparece en Mis reservas (<usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When voy a "Mis reservas" desde el menú
    Then debería ver la reserva con habitación "H105 · Doble", 6 noches, 1 huésped y total "Bs 2.100"
    And la reserva debería estar "Confirmada" con modificaciones "0/1"
    And la reserva debería permitir modificar fechas y cancelar
    And debería ver "<activas>" en Mis reservas

    Examples:
      | usuario | password    | activas                  |
      | lvargas | Huesped123! | Reservas activas: 2 de 2 |
      | dchoque | Huesped123! | Reservas activas: 2 de 6 |
      | admin   | Admin123!   | Reservas activas: 1 de 6 |

  Scenario: La reserva se mantiene al recargar la página
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When voy a "Mis reservas" desde el menú
    And recargo la página
    Then debería ver la reserva con habitación "H105 · Doble", 6 noches, 1 huésped y total "Bs 2.100"

  Scenario: Varios clics seguidos en Confirmar crean una sola reserva
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And completo la hora de llegada y acepto la política de cancelación
    And confirmo la reserva 3 veces seguidas
    Then debería ver la confirmación de la reserva
    And debería existir una sola reserva con las fechas elegidas

  # ---------- Rango de noches ----------

  Scenario: Se puede elegir hasta 14 noches pero no 15
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días
    Then el calendario debería pedir el check-out para un check-in dentro de 30 días
    And el check-out a 1 noche debería estar "habilitado"
    And el check-out a 14 noches debería estar "habilitado"
    And el check-out a 15 noches debería estar "deshabilitado"

  Scenario: Elegir el mismo día como check-out no crea una estadía de 0 noches
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo en el calendario el día dentro de 30 días
    And elijo en el calendario el día dentro de 30 días
    Then el calendario debería indicar "Elija la fecha de check-in."
    And el resumen no debería mostrar noches ni total
    And el botón Confirmar reserva debería estar "deshabilitado"

  Scenario: No se puede elegir un check-out anterior al check-in
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días
    Then el día dentro de 29 días debería estar "deshabilitado" en el calendario
    And el resumen no debería mostrar noches ni total

  # ---------- Fechas permitidas ----------

  Scenario Outline: Días que se pueden elegir como check-in (<caso>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then el día dentro de <dias> días debería estar "<estado>" en el calendario

    Examples:
      | caso                   | dias | estado        |
      | ayer                   | -1   | deshabilitado |
      | hoy                    | 0    | deshabilitado |
      | mañana                 | 1    | habilitado    |
      | último día permitido   | 180  | habilitado    |
      | después de los 180 días | 181  | deshabilitado |

  Scenario: Las fechas ya reservadas no se pueden elegir
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When abro el formulario de reserva
    Then las noches reservadas deberían estar deshabilitadas en el calendario
    And el día dentro de 36 días debería estar "habilitado" en el calendario

  Scenario: Una estadía no puede cruzar fechas ya reservadas
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When abro el formulario de reserva
    And elijo en el calendario el día dentro de 27 días
    Then el día dentro de 30 días debería estar "habilitado" en el calendario
    And el día dentro de 31 días debería estar "deshabilitado" en el calendario

  # ---------- Campos obligatorios y validaciones ----------

  Scenario: Confirmar se habilita al elegir las fechas
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then el botón Confirmar reserva debería estar "deshabilitado"
    When elijo un check-in dentro de 30 días por 6 noches
    Then el botón Confirmar reserva debería estar "habilitado"

  @negative
  Scenario: La hora de llegada es obligatoria
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And acepto solo la política de cancelación
    And confirmo la reserva
    Then debería ver el error "Seleccione la hora estimada de llegada." en el campo "Hora de llegada"
    And debería ver el error de la reserva "Revise los campos marcados."
    And la reserva no debería crearse

  @negative
  Scenario: Es obligatorio aceptar la política de cancelación
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And completo solo la hora de llegada
    And confirmo la reserva
    Then debería ver el error "Debe aceptar la política de cancelación." en el campo "Política de cancelación"
    And debería ver el error de la reserva "Revise los campos marcados."
    And la reserva no debería crearse

  # Los espacios van dentro de las comillas porque Gherkin recorta las celdas de Examples
  @negative
  Scenario Outline: Datos del titular inválidos (<caso>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And completo la hora de llegada y acepto la política de cancelación
    And cambio el campo "<campo>" a "<valor>"
    And confirmo la reserva
    Then debería ver el error "<mensaje>" en el campo "<campo>"
    And debería ver el error de la reserva "Revise los campos marcados."
    And la reserva no debería crearse

    Examples:
      | caso                        | campo   | valor           | mensaje                                                |
      | titular vacío               | Titular |                 | El nombre del titular debe tener al menos 3 caracteres. |
      | titular de 2 caracteres     | Titular | Lu              | El nombre del titular debe tener al menos 3 caracteres. |
      | correo vacío                | Correo  |                 | Ingrese un correo ficticio con dominio .test.          |
      | correo con dominio real     | Correo  | lucia@gmail.com | Ingrese un correo ficticio con dominio .test.          |
      | correo sin arroba           | Correo  | lvargas.test    | Ingrese un correo ficticio con dominio .test.          |

  @negative
  Scenario: Un titular con solo espacios se trata como vacío
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And completo la hora de llegada y acepto la política de cancelación
    And cambio el campo "Titular" a "   "
    And confirmo la reserva
    Then debería ver el error "El nombre del titular debe tener al menos 3 caracteres." en el campo "Titular"
    And la reserva no debería crearse

  @negative @bug @severity=minor @issue=DEF-014
  Scenario: El nombre del titular no acepta números
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And completo la hora de llegada y acepto la política de cancelación
    And cambio el campo "Titular" a "Lucia 123"
    And confirmo la reserva
    Then debería ver un error en el campo "Titular"
    And la reserva no debería crearse

  @negative
  Scenario: Las solicitudes especiales admiten como máximo 200 caracteres
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And completo la hora de llegada y acepto la política de cancelación
    And escribo 201 caracteres en solicitudes especiales
    Then el contador de solicitudes especiales debería mostrar "201/200"
    When confirmo la reserva
    Then debería ver el error "Máximo 200 caracteres." en el campo "Solicitudes especiales"
    And la reserva no debería crearse

  Scenario: Se aceptan solicitudes especiales de 200 caracteres
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And completo la hora de llegada y acepto la política de cancelación
    And escribo 200 caracteres en solicitudes especiales
    Then el contador de solicitudes especiales debería mostrar "200/200"
    When confirmo la reserva
    Then debería ver la confirmación de la reserva

  Scenario Outline: La cantidad de huéspedes depende de la capacidad (<habitacion>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "<habitacion>"
    When abro el formulario de reserva
    Then el selector de huéspedes debería ofrecer de 1 a <capacidad>

    Examples:
      | habitacion | capacidad |
      | H101       | 1         |
      | H105       | 2         |
      | H205       | 3         |
      | H106       | 4         |

  Scenario: Cancelar el formulario no crea la reserva y lo deja vacío
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And cancelo el formulario de reserva
    Then el formulario de reserva debería cerrarse
    And no debería existir ninguna reserva con las fechas elegidas
    When abro el formulario de reserva
    Then el formulario de reserva debería estar vacío

  Scenario: La tecla Escape cierra el formulario
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And presiono la tecla Escape
    Then el formulario de reserva debería cerrarse

  # ---------- Cálculo del total ----------

  Scenario Outline: El total es la tarifa por la cantidad de noches (<habitacion>, <noches> noches)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "<habitacion>"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por <noches> noches
    Then el resumen debería mostrar "<texto>" y un total de "<total>"
    When completo la hora de llegada y acepto la política de cancelación
    And confirmo la reserva
    Then debería ver la confirmación de la reserva
    When voy a "Mis reservas" desde el menú
    Then debería ver la reserva con habitación "<descripcion>", <noches> noches, 1 huésped y total "<total>"

    Examples:
      | habitacion | descripcion     | noches | texto     | total     |
      | H101       | H101 · Simple   | 1      | 1 noche   | Bs 180    |
      | H105       | H105 · Doble    | 6      | 6 noches  | Bs 2.100  |
      | H402       | H402 · Suite    | 14     | 14 noches | Bs 16.800 |

  @security
  Scenario: El total lo calcula la aplicación aunque se envíe otro valor
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When solicito a la aplicación una reserva de "H105" con check-in dentro de 30 días por 6 noches indicando un total de 1
    Then la reserva guardada debería tener un total de "Bs 2.100"

  # Mismas reglas, pero enviadas directamente a la lógica de la aplicación (sin pasar
  # por el calendario): verifica que no dependan solo de la interfaz
  @security
  Scenario Outline: Las reglas de la reserva se validan también fuera del formulario (<caso>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When solicito a la aplicación una reserva de "<habitacion>" con check-in dentro de <dias> días por <noches> noches para <huespedes> huéspedes
    Then la aplicación debería rechazarla con "<mensaje>"

    Examples:
      | caso                           | habitacion | dias | noches | huespedes | mensaje                                                  |
      | 15 noches                      | H105       | 30   | 15     | 1         | La estancia debe ser de 1 a 14 noches.                   |
      | 0 noches                       | H105       | 30   | 0      | 1         | La estancia debe ser de 1 a 14 noches.                   |
      | check-in hoy                   | H105       | 0    | 2      | 1         | El check-in debe ser entre mañana y dentro de 180 días.  |
      | check-in después de 180 días   | H105       | 181  | 2      | 1         | El check-in debe ser entre mañana y dentro de 180 días.  |
      | más huéspedes que la capacidad | H105       | 30   | 2      | 3         | La habitación doble admite de 1 a 2 huésped(es).         |

  @security
  Scenario: No se puede reservar sobre fechas ya reservadas fuera del formulario
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When solicito a la aplicación una reserva de "H105" con check-in dentro de 32 días por 2 noches para 1 huéspedes
    Then la aplicación debería rechazarla con "La habitación ya está reservada en parte de esas fechas."

  # ---------- Límite de reservas activas según el tipo de usuario ----------

  # Las reservas canceladas, finalizadas y no presentadas no cuentan como activas
  Scenario Outline: Reservas activas y límite de cada usuario (<usuario>, <tipo>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    When voy a "Mis reservas" desde el menú
    Then debería ver "<activas>" en Mis reservas

    Examples:
      | usuario | password    | tipo        | activas                  |
      | lvargas | Huesped123! | Huésped     | Reservas activas: 1 de 2 |
      | rmamani | Huesped123! | Huésped     | Reservas activas: 2 de 2 |
      | sflores | Huesped123! | Frecuente   | Reservas activas: 0 de 4 |
      | dchoque | Huesped123! | Corporativo | Reservas activas: 1 de 6 |
      | admin   | Admin123!   | Corporativo | Reservas activas: 0 de 6 |

  @negative
  Scenario Outline: No se puede superar el límite de reservas activas (<usuario>, <tipo>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    And completé mis reservas activas hasta el límite
    When intento reservar la habitación "H105" por 6 noches con check-in dentro de 30 días
    Then debería ver el error de la reserva "Alcanzó el límite de <limite> reservas activas para <tipo>."
    And la reserva no debería crearse
    When cancelo el formulario de reserva
    And voy a "Mis reservas" desde el menú
    Then debería ver "Reservas activas: <limite> de <limite>" en Mis reservas

    Examples:
      | usuario | password    | tipo        | limite |
      | lvargas | Huesped123! | Huésped     | 2      |
      | rmamani | Huesped123! | Huésped     | 2      |
      | dchoque | Huesped123! | Corporativo | 6      |
      | admin   | Admin123!   | Corporativo | 6      |

  @negative
  Scenario: Un usuario con una reserva no presentada reciente no puede reservar
    Given que inicié sesión con usuario "sflores" y contraseña "Huesped123!"
    When intento reservar la habitación "H105" por 6 noches con check-in dentro de 30 días
    Then debería ver el error de la reserva "Tiene una reserva no presentada en los últimos 30 días. No puede reservar por ahora."
    And la reserva no debería crearse

  @negative
  Scenario: Un usuario bloqueado no puede llegar a reservar
    Given que estoy en la página de login
    When inicio sesión con usuario "ptorrez" y contraseña "Huesped123!"
    Then debería ver el mensaje de error "Usuario bloqueado. Contacte a recepción."
    When navego a la ruta "/habitaciones/H105"
    Then debería permanecer en la página de login

  @bug @severity=minor @issue=DEF-013
  Scenario Outline: Un usuario que no puede reservar es avisado al abrir el formulario (<usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then debería ver el error de la reserva "<mensaje>"

    Examples:
      | usuario | mensaje                                                                             |
      | rmamani | Alcanzó el límite de 2 reservas activas para Huésped.                               |
      | sflores | Tiene una reserva no presentada en los últimos 30 días. No puede reservar por ahora. |

  # ---------- Accesibilidad ----------

  @accessibility @bug @severity=minor @issue=DEF-011
  Scenario: El foco pasa al formulario de reserva al abrirlo
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    Then el foco debería estar dentro del formulario de reserva

  @accessibility @bug @severity=minor @issue=DEF-012
  Scenario: Los errores del formulario de reserva se marcan de forma accesible
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And estoy en el detalle de la habitación "H105"
    When abro el formulario de reserva
    And elijo un check-in dentro de 30 días por 6 noches
    And acepto solo la política de cancelación
    And confirmo la reserva
    Then debería ver el error "Seleccione la hora estimada de llegada." en el campo "Hora de llegada"
    And el campo "Hora de llegada" del formulario debería estar marcado como inválido
    And el foco debería estar en el campo "Hora de llegada" del formulario
