Feature: Gestión de mis reservas
  Como huésped con reservas
  Quiero ver mis reservas, modificar sus fechas y cancelarlas
  Para gestionar mis estadías

  # Cada escenario describe el comportamiento esperado de Mis reservas, de la
  # modificación de fechas y de la cancelación. Los escenarios que modifican o
  # cancelan crean antes su propia reserva desde la interfaz: las reservas
  # sembradas solo se consultan o reciben intentos que la aplicación debe rechazar.
  # Las fechas son siempre relativas a hoy ("dentro de N días"), nunca fijas.
  # Lo que ya prueban otros incisos (login y sesión, creación de reservas, usuario
  # nuevo) no se repite aquí.
  # @severity indica el riesgo al que apunta cada escenario; el tag @bug marca los
  # escenarios cuyo comportamiento esperado la aplicación no cumple actualmente, y
  # @issue enlaza con el defecto en docs/REPORTE_DEFECTOS.md.

  # ---------- Ver Mis reservas ----------

  @smoke @severity=normal
  Scenario: Ver Mis reservas desde el menú
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When voy a "Mis reservas" desde el menú
    Then debería estar en la ruta "/mis-reservas"
    And la tabla de Mis reservas debería tener las columnas "Código, Habitación, Check-in, Check-out, Noches, Huésp., Total, Modif., Estado, Acciones"
    And el filtro "Todas" debería estar activo
    And la reserva creada debería figurar primera en Mis reservas
    And las reservas deberían estar ordenadas de la más nueva a la más antigua

  # El motivo por el que una acción no está disponible se muestra al pasar el mouse
  @severity=critical
  Scenario Outline: Acciones disponibles según la situación de la reserva (<situacion>, <usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "Huesped123!"
    And que tengo la reserva sembrada "<situacion>"
    When voy a "Mis reservas" desde el menú
    Then la reserva debería estar "<estado>" con modificaciones "0/1"
    And el botón "Modificar fechas" de la reserva debería estar "<modificar>"
    And el botón "Modificar fechas" de la reserva debería indicar "<motivo_modificar>"
    And el botón "Cancelar" de la reserva debería estar "<cancelar>"
    And el botón "Cancelar" de la reserva debería indicar "<motivo_cancelar>"

    Examples:
      | situacion           | usuario | estado        | modificar     | motivo_modificar                                                     | cancelar      | motivo_cancelar                                           |
      | finalizada          | lvargas | Finalizada    | ausente       |                                                                      | ausente       |                                                           |
      | en curso            | rmamani | En curso      | deshabilitado | Solo se pueden modificar reservas confirmadas.                       | deshabilitado | Solo se puede cancelar hasta el día anterior al check-in. |
      | no presentada       | sflores | No presentado | ausente       |                                                                      | ausente       |                                                           |
      | cancelada           | dchoque | Cancelada     | ausente       |                                                                      | ausente       |                                                           |
      | con check-in mañana | dchoque | Confirmada    | deshabilitado | Solo se puede modificar con 2 días o más de anticipación al check-in. | habilitado    |                                                           |

  @severity=normal
  Scenario Outline: Filtrar Mis reservas por estado (<filtro>, <usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    When voy a "Mis reservas" desde el menú
    And filtro Mis reservas por "<filtro>"
    Then el filtro "<filtro>" debería estar activo
    And deberían verse solo las reservas en estado "<estado>"

    Examples:
      | filtro        | estado        | usuario | password    |
      | Confirmadas   | Confirmada    | lvargas | Huesped123! |
      | Finalizadas   | Finalizada    | lvargas | Huesped123! |
      | En curso      | En curso      | rmamani | Huesped123! |
      | No presentado | No presentado | sflores | Huesped123! |
      | Canceladas    | Cancelada     | dchoque | Huesped123! |
      | Canceladas    | Cancelada     | lvargas | Huesped123! |
      | Confirmadas   | Confirmada    | admin   | Admin123!   |

  # Activas = confirmadas y en curso; el límite depende del tipo de usuario
  @severity=normal
  Scenario Outline: El resumen de reservas activas coincide con la tabla (<usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    When voy a "Mis reservas" desde el menú
    Then el resumen de reservas activas debería coincidir con las reservas confirmadas y en curso de la tabla
    And el límite de reservas activas debería ser <limite>

    Examples:
      | usuario | password    | limite |
      | lvargas | Huesped123! | 2      |
      | rmamani | Huesped123! | 2      |
      | sflores | Huesped123! | 4      |
      | dchoque | Huesped123! | 6      |
      | admin   | Admin123!   | 6      |

  # ---------- Modificar fechas ----------

  # La nueva estadía empieza el mismo día: se extiende sobre sus propias fechas
  @smoke @severity=blocker
  Scenario Outline: Modificar una reserva a 14 noches (<usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And guardo el resumen de reservas activas
    When abro la modificación de fechas de la reserva
    And elijo nuevas fechas con check-in dentro de 30 días por 14 noches
    Then la modificación debería mostrar 14 noches y un nuevo total de "Bs 4.900"
    When guardo los cambios de la modificación
    Then debería ver la confirmación de la modificación
    And el formulario de modificación debería cerrarse
    And debería ver la reserva con habitación "H105 · Doble", 14 noches, 1 huésped y total "Bs 4.900"
    And la reserva debería estar "Confirmada" con modificaciones "1/1"
    And el botón "Modificar fechas" de la reserva debería estar "deshabilitado"
    And el botón "Modificar fechas" de la reserva debería indicar "La reserva ya fue modificada una vez."
    And el botón "Cancelar" de la reserva debería estar "habilitado"
    And el resumen de reservas activas no debería cambiar

    Examples:
      | usuario | password    |
      | lvargas | Huesped123! |
      | dchoque | Huesped123! |
      | admin   | Admin123!   |

  @severity=normal
  Scenario: El formulario de modificación muestra la reserva y sus reglas
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    Then la modificación debería mostrar la reserva, su habitación y sus fechas actuales
    And la modificación debería ofrecer "Mantener 6 noches (solo cambia el check-in)" y "Elegir nuevas fechas"
    And la modificación debería indicar check-in entre mañana y dentro de 180 días
    And la modificación debería avisar "Solo se permite una modificación por reserva."
    And el botón Guardar cambios debería estar "deshabilitado"
    When elijo la opción "Elegir nuevas fechas"
    Then la modificación debería indicar check-in entre mañana y dentro de 180 días, de 1 a 14 noches
    And el botón Guardar cambios debería estar "deshabilitado"

  @severity=normal
  Scenario: Mantener las noches y cambiar solo el check-in
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    And mantengo las noches y elijo el check-in dentro de 40 días
    Then la modificación debería mostrar 6 noches y un nuevo total de "Bs 2.100"
    When guardo los cambios de la modificación
    Then debería ver la confirmación de la modificación
    And debería ver la reserva con habitación "H105 · Doble", 6 noches, 1 huésped y total "Bs 2.100"
    And la reserva debería estar "Confirmada" con modificaciones "1/1"

  @negative @severity=normal
  Scenario Outline: Cerrar el formulario de modificación no cambia la reserva (<forma>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    And elijo nuevas fechas con check-in dentro de 40 días por 14 noches
    And cierro el formulario de modificación con "<forma>"
    Then el formulario de modificación debería cerrarse
    And debería ver la reserva con habitación "H105 · Doble", 6 noches, 1 huésped y total "Bs 2.100"
    And la reserva debería estar "Confirmada" con modificaciones "0/1"
    And la reserva guardada no debería cambiar

    Examples:
      | forma    |
      | Cancelar |
      | Escape   |

  @negative @severity=normal
  Scenario: Guardar las mismas fechas no consume la modificación
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    And mantengo las noches y elijo el check-in dentro de 30 días
    And guardo los cambios de la modificación
    Then debería ver el error de la modificación "Las nuevas fechas son iguales a las actuales."
    And la reserva guardada no debería cambiar

  @accessibility @bug @severity=minor @issue=DEF-011
  Scenario: El foco pasa al formulario de modificación al abrirlo
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    Then el foco debería estar dentro del formulario de modificación

  # ---------- Rango de noches y total de la modificación ----------

  @severity=critical
  Scenario Outline: Al modificar, el total se recalcula con la tarifa (<habitacion>, <noches> noches)
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "<habitacion>" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    And elijo nuevas fechas con check-in dentro de 30 días por <noches> noches
    Then la modificación debería mostrar <noches> noches y un nuevo total de "<total>"
    When guardo los cambios de la modificación
    Then debería ver la confirmación de la modificación
    And debería ver la reserva con habitación "<descripcion>", <noches> noches, 1 huésped y total "<total>"
    And el total guardado de la reserva debería ser "<total>"

    Examples:
      | habitacion | descripcion   | noches | total     |
      | H105       | H105 · Doble  | 13     | Bs 4.550  |
      | H105       | H105 · Doble  | 14     | Bs 4.900  |
      | H402       | H402 · Suite  | 14     | Bs 16.800 |

  @severity=critical
  Scenario: Se puede modificar hasta 14 noches pero no 15
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    And elijo la opción "Elegir nuevas fechas"
    And elijo en el calendario de modificación el check-in dentro de 30 días
    Then el calendario de modificación debería pedir el check-out para un check-in dentro de 30 días
    And el día dentro de 31 días debería estar "habilitado" en el calendario de modificación
    And el día dentro de 44 días debería estar "habilitado" en el calendario de modificación
    And el día dentro de 45 días debería estar "deshabilitado" en el calendario de modificación

  # Mismas reglas, pero enviadas directamente a la lógica de la aplicación (sin pasar
  # por el calendario): verifica que no dependan solo de la interfaz
  @security @severity=critical
  Scenario Outline: Las reglas de la modificación se validan también fuera del formulario (<caso>)
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When solicito a la aplicación modificar la reserva con check-in dentro de <dias> días por <noches> noches
    Then la aplicación debería rechazarla con "<mensaje>"
    And la reserva guardada no debería cambiar

    Examples:
      | caso                          | dias | noches | mensaje                                                 |
      | 15 noches                     | 30   | 15     | La estancia debe ser de 1 a 14 noches.                  |
      | 0 noches                      | 30   | 0      | La estancia debe ser de 1 a 14 noches.                  |
      | check-out antes del check-in  | 30   | -2     | La estancia debe ser de 1 a 14 noches.                  |
      | check-in hoy                  | 0    | 2      | El check-in debe ser entre mañana y dentro de 180 días. |
      | check-in ayer                 | -1   | 2      | El check-in debe ser entre mañana y dentro de 180 días. |
      | check-in después de 180 días  | 181  | 2      | El check-in debe ser entre mañana y dentro de 180 días. |

  @security @severity=blocker
  Scenario: El total y el contador de la modificación los calcula la aplicación aunque se envíen otros valores
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When solicito a la aplicación modificar la reserva a 14 noches con check-in dentro de 30 días indicando total 1, tarifa 1, modificaciones -5 y el usuario "lvargas"
    Then la reserva guardada debería tener 14 noches, total "Bs 4.900", modificaciones 1 y pertenecer al usuario "dchoque"

  # ---------- Fechas permitidas y ocupadas en la modificación ----------

  @severity=critical
  Scenario Outline: Días que se pueden elegir como nuevo check-in (<caso>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    Then el día dentro de <dias> días debería estar "<estado>" en el calendario de modificación

    Examples:
      | caso                    | dias | estado        |
      | ayer                    | -1   | deshabilitado |
      | hoy                     | 0    | deshabilitado |
      | mañana                  | 1    | habilitado    |
      | último día permitido    | 180  | habilitado    |
      | después de los 180 días | 181  | deshabilitado |

  @severity=critical
  Scenario: Las fechas de otra reserva mía en la misma habitación no se pueden elegir
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And reservé la habitación "H105" por 2 noches con check-in dentro de 50 días
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    Then las noches de mi otra reserva deberían estar deshabilitadas en el calendario de modificación
    When solicito a la aplicación modificar la reserva con check-in dentro de 32 días por 2 noches
    Then la aplicación debería rechazarla con "La habitación ya está reservada en parte de esas fechas."
    And la reserva guardada no debería cambiar

  @security @severity=blocker
  Scenario: Las fechas reservadas por otro usuario no se pueden elegir al modificar
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé por 2 noches con check-in dentro de 60 días la habitación reservada por "lvargas"
    And voy a "Mis reservas" desde el menú
    When abro la modificación de fechas de la reserva
    Then las noches reservadas por "lvargas" deberían estar deshabilitadas en el calendario de modificación
    When solicito a la aplicación modificar la reserva a las fechas reservadas por "lvargas"
    Then la aplicación debería rechazarla con "La habitación ya está reservada en parte de esas fechas."
    And la reserva de "lvargas" no debería cambiar

  @severity=critical
  Scenario: Al modificar, las fechas anteriores se liberan y las nuevas quedan ocupadas
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When modifico la reserva a 14 noches con check-in dentro de 40 días
    And abro el detalle de la habitación de la reserva
    Then las fechas reservadas deberían figurar como ocupadas en el detalle
    And las fechas anteriores de la reserva no deberían figurar como ocupadas en el detalle
    When cierro sesión
    And que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    Then se puede reservar la habitación "H105" por 6 noches con check-in dentro de 30 días
    When solicito a la aplicación una reserva de "H105" con check-in dentro de 45 días por 2 noches para 1 huéspedes
    Then la aplicación debería rechazarla con "La habitación ya está reservada en parte de esas fechas."

  # ---------- Límite de modificaciones y anticipación ----------

  @severity=critical
  Scenario: Una reserva solo se puede modificar una vez
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And modifiqué la reserva a 14 noches con check-in dentro de 30 días
    Then el botón "Modificar fechas" de la reserva debería estar "deshabilitado"
    And el botón "Modificar fechas" de la reserva debería indicar "La reserva ya fue modificada una vez."
    When solicito a la aplicación modificar la reserva con check-in dentro de 30 días por 6 noches
    Then la aplicación debería rechazarla con "La reserva ya fue modificada una vez."
    And la reserva guardada no debería cambiar

  @severity=critical
  Scenario Outline: Anticipación mínima para modificar (check-in dentro de <dias> días)
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H108" por 2 noches con check-in dentro de <dias> días
    And voy a "Mis reservas" desde el menú
    Then el botón "Modificar fechas" de la reserva debería estar "<estado>"
    And el botón "Modificar fechas" de la reserva debería indicar "<motivo>"
    When solicito a la aplicación modificar la reserva con check-in dentro de 60 días por 2 noches
    Then la aplicación debería responder "<respuesta>"

    Examples:
      | dias | estado        | motivo                                                               | respuesta                                                            |
      | 1    | deshabilitado | Solo se puede modificar con 2 días o más de anticipación al check-in. | Solo se puede modificar con 2 días o más de anticipación al check-in. |
      | 2    | habilitado    |                                                                      | aceptada                                                             |

  # Modificar no crea una reserva nueva, así que el límite no lo impide
  @severity=critical
  Scenario: Con el límite de reservas activas alcanzado se puede modificar una reserva
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    Then debería ver "Reservas activas: 2 de 2" en Mis reservas
    When modifico la reserva a 14 noches con check-in dentro de 30 días
    Then debería ver la reserva con habitación "H105 · Doble", 14 noches, 1 huésped y total "Bs 4.900"
    And debería ver "Reservas activas: 2 de 2" en Mis reservas

  # ---------- Cancelar ----------

  @smoke @severity=blocker
  Scenario Outline: Cancelar una reserva (<usuario>)
    Given que inicié sesión con usuario "<usuario>" y contraseña "<password>"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And guardo el resumen de reservas activas
    When cancelo la reserva desde Mis reservas
    Then el diálogo de cancelación debería pedir confirmar la reserva
    And el foco debería estar en el botón "No, volver"
    When confirmo la cancelación
    Then debería ver la confirmación de la cancelación
    And el diálogo de cancelación debería cerrarse
    And la reserva debería estar "Cancelada" con modificaciones "0/1"
    And la reserva no debería tener acciones
    And las reservas activas deberían bajar en 1

    Examples:
      | usuario | password    |
      | lvargas | Huesped123! |
      | dchoque | Huesped123! |
      | admin   | Admin123!   |

  # El flujo completo del enunciado: ver Mis reservas, modificar a 14 noches y cancelar
  @smoke @severity=blocker
  Scenario: Ver Mis reservas, modificar una reserva a 14 noches y cancelarla
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When voy a "Mis reservas" desde el menú
    Then debería ver la reserva con habitación "H105 · Doble", 6 noches, 1 huésped y total "Bs 2.100"
    And debería ver "Reservas activas: 2 de 2" en Mis reservas
    When modifico la reserva a 14 noches con check-in dentro de 30 días
    Then debería ver la reserva con habitación "H105 · Doble", 14 noches, 1 huésped y total "Bs 4.900"
    And la reserva debería estar "Confirmada" con modificaciones "1/1"
    When cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    Then debería ver la confirmación de la cancelación
    And debería ver la reserva con habitación "H105 · Doble", 14 noches, 1 huésped y total "Bs 4.900"
    And la reserva debería estar "Cancelada" con modificaciones "1/1"
    And debería ver "Reservas activas: 1 de 2" en Mis reservas

  @negative @severity=critical
  Scenario Outline: Desistir de la cancelación mantiene la reserva (<forma>)
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When cancelo la reserva desde Mis reservas
    And desisto de la cancelación con "<forma>"
    Then el diálogo de cancelación debería cerrarse
    And la reserva debería estar "Confirmada" con modificaciones "0/1"
    And el botón "Cancelar" de la reserva debería estar "habilitado"
    And la reserva guardada no debería estar cancelada
    And debería ver "Reservas activas: 2 de 2" en Mis reservas

    Examples:
      | forma      |
      | No, volver |
      | Escape     |

  @severity=normal
  Scenario: Un doble clic en "Sí, cancelar" cancela la reserva una sola vez
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When cancelo la reserva desde Mis reservas
    And confirmo la cancelación con doble clic
    Then debería ver la confirmación de la cancelación
    And no debería ver errores en Mis reservas
    And la reserva debería estar "Cancelada" con modificaciones "0/1"

  @severity=critical
  Scenario: Se puede cancelar una reserva el día anterior al check-in
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H108" por 2 noches con check-in dentro de 1 días
    And voy a "Mis reservas" desde el menú
    Then el botón "Cancelar" de la reserva debería estar "habilitado"
    When cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    Then debería ver la confirmación de la cancelación
    And la reserva debería estar "Cancelada" con modificaciones "0/1"

  @security @severity=critical
  Scenario: Una reserva cancelada no se puede volver a cancelar ni modificar
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And cancelé la reserva desde Mis reservas
    Then la reserva no debería tener acciones
    When solicito a la aplicación cancelar la reserva
    Then la aplicación debería rechazarla con "La reserva ya fue cancelada."
    When solicito a la aplicación modificar la reserva con check-in dentro de 60 días por 2 noches
    Then la aplicación debería rechazarla con "Solo se pueden modificar reservas confirmadas."
    And la reserva guardada no debería cambiar

  # Reservas sembradas: solo reciben intentos que la aplicación debe rechazar
  @security @severity=critical
  Scenario Outline: No se puede cancelar ni modificar una reserva <situacion> fuera de Mis reservas
    Given que inicié sesión con usuario "<usuario>" y contraseña "Huesped123!"
    And que tengo la reserva sembrada "<situacion>"
    When solicito a la aplicación cancelar la reserva
    Then la aplicación debería rechazarla con "<mensaje>"
    When solicito a la aplicación modificar la reserva con check-in dentro de 60 días por 2 noches
    Then la aplicación debería rechazarla con "Solo se pueden modificar reservas confirmadas."
    And la reserva guardada no debería cambiar

    Examples:
      | situacion     | usuario | mensaje                                                   |
      | finalizada    | lvargas | Solo se puede cancelar hasta el día anterior al check-in. |
      | en curso      | rmamani | Solo se puede cancelar hasta el día anterior al check-in. |
      | no presentada | sflores | La reserva fue marcada como no presentado.                |
      | cancelada     | dchoque | La reserva ya fue cancelada.                              |

  @severity=critical
  Scenario: Cancelar una reserva libera sus fechas para otros huéspedes
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And cancelé la reserva desde Mis reservas
    When abro el detalle de la habitación de la reserva
    Then las fechas de la reserva no deberían figurar como ocupadas en el detalle
    When cierro sesión
    And que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    Then se puede reservar la habitación "H105" por 6 noches con check-in dentro de 30 días

  @severity=critical
  Scenario: Cancelar una reserva libera el cupo del límite de reservas activas
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And debería ver "Reservas activas: 2 de 2" en Mis reservas
    When cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    Then debería ver la confirmación de la cancelación
    And debería ver "Reservas activas: 1 de 2" en Mis reservas
    And se puede reservar la habitación "H106" por 6 noches con check-in dentro de 30 días

  # ---------- Seguridad e integridad de los datos ----------

  # Igual que BUG-004, se prueba contra la lógica de la reserva y no desde la
  # interfaz, para no depender de BUG-002 (la sesión del bloqueado sigue activa)
  @security @bug @severity=critical @issue=BUG-004
  Scenario: Un usuario bloqueado no puede modificar sus reservas fuera del formulario
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And el usuario "dchoque" es bloqueado por recepción
    When solicito a la aplicación modificar la reserva con check-in dentro de 30 días por 14 noches
    Then la aplicación debería rechazar la modificación
    And la reserva guardada no debería cambiar

  @security @severity=blocker
  Scenario Outline: El rol administrador no da acceso a las reservas de otros usuarios (<accion>, <usuario>)
    Given que inicié sesión con usuario "admin" y contraseña "Admin123!"
    When voy a "Mis reservas" desde el menú
    Then no debería tener reservas en Mis reservas
    When solicito a la aplicación "<accion>" una reserva activa de "<usuario>"
    Then la aplicación debería rechazarla con "La reserva no existe."
    And la reserva de "<usuario>" no debería cambiar

    Examples:
      | accion    | usuario |
      | cancelar  | lvargas |
      | modificar | lvargas |
      | cancelar  | rmamani |
      | modificar | rmamani |

  # La app guarda las reservas en localStorage, editable desde DevTools
  @security @bug @severity=blocker @issue=DEF-019
  Scenario: Reiniciar el contador de modificaciones en el almacenamiento no permite modificar otra vez
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And modifiqué la reserva a 14 noches con check-in dentro de 30 días
    When edito en el almacenamiento el contador de modificaciones de la reserva a 0
    And solicito a la aplicación modificar la reserva con check-in dentro de 30 días por 6 noches
    Then la aplicación debería rechazarla con "La reserva ya fue modificada una vez."

  @security @bug @severity=blocker @issue=DEF-019
  Scenario: Editar el total en el almacenamiento no cambia el monto de la reserva
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    When edito en el almacenamiento el total de la reserva a 1
    And voy a "Mis reservas" desde el menú
    Then debería ver la reserva con habitación "H105 · Doble", 6 noches, 1 huésped y total "Bs 2.100"

  @security @bug @severity=blocker @issue=DEF-019
  Scenario: Cambiar el dueño de una reserva en el almacenamiento no permite cancelar la reserva de otro usuario
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And cierro sesión
    And que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    When edito en el almacenamiento la reserva para que figure a nombre de "lvargas"
    And solicito a la aplicación cancelar la reserva
    Then la aplicación debería rechazarla con "La reserva no existe."
    And la reserva guardada no debería estar cancelada

  @security @severity=blocker
  Scenario: Modificar y cancelar mis reservas no altera los datos de los demás usuarios
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And guardo los datos de los usuarios y reservas existentes
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    When modifico la reserva a 14 noches con check-in dentro de 30 días
    And cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    Then debería ver la confirmación de la cancelación
    And los usuarios y las reservas existentes no deberían cambiar

  # ---------- Persistencia y concurrencia ----------

  @severity=critical
  Scenario: La modificación y la cancelación se mantienen al recargar y al volver a ingresar
    Given que inicié sesión con usuario "lvargas" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And voy a "Mis reservas" desde el menú
    And modifiqué la reserva a 14 noches con check-in dentro de 30 días
    When recargo la página
    Then debería ver la reserva con habitación "H105 · Doble", 14 noches, 1 huésped y total "Bs 4.900"
    And la reserva debería estar "Confirmada" con modificaciones "1/1"
    When cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    And debería ver la confirmación de la cancelación
    And recargo la página
    Then la reserva debería estar "Cancelada" con modificaciones "1/1"
    When cierro sesión
    And inicio sesión con usuario "lvargas" y contraseña "Huesped123!"
    And voy a "Mis reservas" desde el menú
    Then debería ver la reserva con habitación "H105 · Doble", 14 noches, 1 huésped y total "Bs 4.900"
    And la reserva debería estar "Cancelada" con modificaciones "1/1"
    And debería ver "Reservas activas: 1 de 2" en Mis reservas

  @severity=critical
  Scenario: No se puede cancelar dos veces la misma reserva desde dos pestañas
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And abro la aplicación en una nueva pestaña
    And voy a "Mis reservas" desde el menú
    When cambio a la pestaña 1
    And voy a "Mis reservas" desde el menú
    And cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    Then debería ver la confirmación de la cancelación
    When cambio a la pestaña 2
    And cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    Then debería ver el error de Mis reservas "La reserva ya fue cancelada."
    And no debería ver la confirmación de la cancelación
    And la reserva guardada debería estar cancelada

  @severity=critical
  Scenario: Desde otra pestaña no se puede modificar una reserva ya modificada
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And abro la aplicación en una nueva pestaña
    And voy a "Mis reservas" desde el menú
    When cambio a la pestaña 1
    And voy a "Mis reservas" desde el menú
    And modifico la reserva a 14 noches con check-in dentro de 30 días
    And cambio a la pestaña 2
    And intento modificar la reserva a 14 noches con check-in dentro de 40 días
    Then debería ver el error de la modificación "La reserva ya fue modificada una vez."
    And la reserva guardada no debería cambiar

  @severity=critical
  Scenario: Desde otra pestaña no se puede modificar una reserva ya cancelada
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And abro la aplicación en una nueva pestaña
    And voy a "Mis reservas" desde el menú
    When cambio a la pestaña 1
    And voy a "Mis reservas" desde el menú
    And cancelé la reserva desde Mis reservas
    And cambio a la pestaña 2
    And intento modificar la reserva a 14 noches con check-in dentro de 40 días
    Then debería ver el error de la modificación "Solo se pueden modificar reservas confirmadas."
    And la reserva guardada no debería cambiar

  @bug @severity=minor @issue=DEF-020
  Scenario: Tras rechazar una cancelación repetida, Mis reservas muestra el estado actual
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And abro la aplicación en una nueva pestaña
    And voy a "Mis reservas" desde el menú
    When cambio a la pestaña 1
    And voy a "Mis reservas" desde el menú
    And cancelé la reserva desde Mis reservas
    And cambio a la pestaña 2
    And cancelo la reserva desde Mis reservas
    And confirmo la cancelación
    Then debería ver el error de Mis reservas "La reserva ya fue cancelada."
    And la fila de la reserva debería mostrar lo guardado por la aplicación

  @bug @severity=minor @issue=DEF-020
  Scenario: Tras rechazar una modificación repetida, Mis reservas muestra el estado actual
    Given que inicié sesión con usuario "dchoque" y contraseña "Huesped123!"
    And reservé la habitación "H105" por 6 noches con check-in dentro de 30 días
    And abro la aplicación en una nueva pestaña
    And voy a "Mis reservas" desde el menú
    When cambio a la pestaña 1
    And voy a "Mis reservas" desde el menú
    And modifico la reserva a 14 noches con check-in dentro de 30 días
    And cambio a la pestaña 2
    And intento modificar la reserva a 14 noches con check-in dentro de 40 días
    And cierro el formulario de modificación con "Cancelar"
    Then la fila de la reserva debería mostrar lo guardado por la aplicación
