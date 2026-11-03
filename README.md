# examenPruebaRoy

Resolución del examen de automatización sobre [Hotel QA](https://hotel-qa-f51.pages.dev/).

## Stack

- JavaScript
- WebdriverIO
- Cucumber
- Page Object Model (POM)
- Allure Report

## Requisitos

- Node.js 20 o superior
- Java 8 o superior (para generar el reporte de Allure)
- Google Chrome

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm test          # ejecuta todos los features
npm run report    # genera y abre el reporte de Allure
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
│       └── bookingModal.js                 # modal de reserva
└── step-definitions/                       # implementación de los pasos
    ├── hooks.js                            # limpia localStorage antes de cada escenario
    ├── login.steps.js
    ├── register.steps.js
    ├── booking.steps.js
    └── myBookings.steps.js
```

## Incisos

1. Login para acceder a la página.
2. Ingresar, ver detalle de una habitación y reservarla (6 noches).
3. Registrar un nuevo usuario, ver detalle de una habitación y reservarla (2 noches).
4. Ingresar, ver "Mis reservas", modificar la fecha de una reserva (14 noches) y cancelar una reserva.
