const { Given, When, Then } = require('@wdio/cucumber-framework')
const { expect } = require('@wdio/globals')

const RoomsPage = require('../pageobjects/rooms.page')
const RoomDetailPage = require('../pageobjects/roomDetail.page')
const BookingModal = require('../pageobjects/components/bookingModal')

// TODO: steps de detalle de habitación y reserva (incisos 2 y 3)
