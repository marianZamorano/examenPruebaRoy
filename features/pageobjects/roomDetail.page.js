const Page = require('./page')
const BookingModal = require('./components/bookingModal')

/**
* Detalle de una habitación (/habitaciones/:codigo)
*/
class RoomDetailPage extends Page {
    get title () { return $('.room-detail__title') }
    get type () { return $('.room-detail__type') }
    get capacity () { return $('.room-detail__capacity') }
    get rate () { return $('.room-detail__rate') }
    get floor () { return $('.room-detail__floor') }
    get view () { return $('.room-detail__view') }
    get amenities () { return $$('.room-detail__amenities li') }
    get bookedDates () { return $('.room-detail__booked') }
    get backLink () { return $('.back-link') }
    get btnBook () { return $('.room-detail__book-btn') }

    async openBookingModal () {
        await this.btnBook.click()
        await BookingModal.modal.waitForDisplayed()
    }

    open (roomCode) {
        return super.open(`habitaciones/${roomCode}`)
    }
}

module.exports = new RoomDetailPage()
