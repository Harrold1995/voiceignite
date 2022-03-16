export default {

  data () {
    return {}
  },

  methods: {
    getAppointmentService (appointment) {
      let providerService = this.getProviderById(appointment.providerId).serviceList.find(service => service.id === appointment.serviceId)

      return providerService ? providerService : this.getServiceById(appointment.serviceId)
    },

    getAppointmentPrice (savedServiceId, service, bookings, isList) {
      let totalBookings = 0
      let $this = this

      let isChangedService = parseInt(savedServiceId) !== parseInt(service.id)

      bookings.forEach(function (booking) {
        // for old bookings use price from booking
        booking.payments.forEach(function () {
          if (['approved', 'pending'].includes(booking.status)) {
            totalBookings += $this.getBookingPrice(booking, isChangedService, isChangedService ? service.price : booking.price, booking.aggregatedPrice)
          }
        })

        // for new bookings use price from service
        if (booking.payments.length === 0 && !isList) {
          totalBookings += $this.getBookingPrice(booking, true, service.price, service.aggregatedPrice)
        }
      })

      return this.getFormattedPrice(
        totalBookings >= 0 ? totalBookings : 0,
        !this.$root.settings.payments.hideCurrencySymbolFrontend
      )
    },

    getBookingPrice (booking, isNewBooking, servicePrice, aggregatedPrice) {
      let extrasPriceTotal = 0

      booking.extras.forEach(function (extra) {
        if (typeof extra.selected === 'undefined' || extra.selected === true) {
          let aggregatedExtraPrice = extra.aggregatedPrice === null ? aggregatedPrice : extra.aggregatedPrice

          extrasPriceTotal += extra.price * extra.quantity * (aggregatedExtraPrice ? booking.persons : 1)
        }
      })

      let servicePriceTotal = (isNewBooking ? servicePrice : booking.price) * (aggregatedPrice ? booking.persons : 1)
      let subTotal = servicePriceTotal + extrasPriceTotal
      let discountTotal = (subTotal / 100 * (booking.coupon ? booking.coupon.discount : 0)) + (booking.coupon ? booking.coupon.deduction : 0)

      return subTotal - discountTotal
    }
  }
}
