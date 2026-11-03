# examenPruebaRoy

Resolución de la prueba diagnóstica de automatización E2E sobre [Hotel QA](https://hotel-qa-f51.pages.dev/).

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
├── *.feature            # escenarios en Gherkin (uno por inciso)
├── pageobjects/         # Page Objects (POM)
└── step-definitions/    # implementación de los pasos
```

## Incisos

1. Login para acceder a la página.
2. Ingresar, ver detalle de una habitación y reservarla (6 noches).
3. Registrar un nuevo usuario, ver detalle de una habitación y reservarla (2 noches).
4. Ingresar, ver "Mis reservas", modificar la fecha de una reserva (14 noches) y cancelar una reserva.
