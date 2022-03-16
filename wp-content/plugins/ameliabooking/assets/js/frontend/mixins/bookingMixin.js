import moment from 'moment'
import currentUserMixin from '../../common/mixins/currentUserMixin'

export default {
  mixins: [currentUserMixin],

  data () {
    return {
      phonePopulated: false
    }
  },

  methods: {
    getAppointmentDuration (service, extras) {
      return service.duration + extras.filter(extra => extra.selected).map(extra => extra.duration * extra.quantity).reduce((a, b) => a + b, 0)
    },

    getFormattedTimeSlot (slot, duration, visibility = true) {
      let secondTimeSlot = visibility ? ` - ${moment(slot, 'HH:mm:ss').add(duration, 'seconds').format(this.momentTimeFormat)}` : ''
      return `${this.getFrontedFormattedTime(slot)}${secondTimeSlot}`
    },

    handleCapacity (dayMinimumCapacity, enabledGroup) {
      let $this = this
      let groupEnabled = false
      let maxCapacity = 0
      let minCapacity = 0
      let serviceMinCapacity = 0

      if ($this.appointment.serviceId) {
        if ($this.appointment.providerId) {
          let service = $this.getProviderService(this.appointment.providerId, this.appointment.serviceId)

          serviceMinCapacity = service.minCapacity

          groupEnabled = service.maxCapacity > 1 && (service.bringingAnyone || !this.$root.settings.appointments.allowBookingIfNotMin)
          maxCapacity = service.maxCapacity
          minCapacity = this.$root.settings.appointments.allowBookingIfNotMin ? 1 : service.minCapacity
        } else {
          this.options.entities.employees.forEach(function (employee) {
            employee.serviceList.forEach(function (employeeService) {
              if (employeeService.id === $this.appointment.serviceId) {
                let service = $this.getProviderService(employee.id, $this.appointment.serviceId)

                serviceMinCapacity = service.minCapacity

                if (service.maxCapacity > 1 && (service.bringingAnyone || !$this.$root.settings.appointments.allowBookingIfNotMin)) {
                  groupEnabled = true
                }

                if (service.maxCapacity > maxCapacity || maxCapacity === 0) {
                  maxCapacity = service.maxCapacity
                }

                if (minCapacity < service.minCapacity) {
                  minCapacity = $this.$root.settings.appointments.allowBookingIfNotMin ? 1 : service.minCapacity
                }
              }
            })
          })
        }
      }

      if (!dayMinimumCapacity && this.$root.settings.appointments.openedBookingAfterMin) {
        minCapacity = serviceMinCapacity
      }

      this.group.options = []

      for (let i = minCapacity - 1; i < maxCapacity; i++) {
        if (i !== 0) {
          let persons = 'ameliaBooking' in window && 'form' in window.ameliaBooking && window.ameliaBooking.form.allPersons ? i + 1 : i

          this.group.options.push({
            label: persons === 1 ? persons + ' ' + this.$root.labels.person_upper : persons + ' ' + this.$root.labels.persons_upper,
            value: i + 1
          })
        }
      }

      if (maxCapacity !== 0 && this.appointment.bookings[0].persons > maxCapacity) {
        this.appointment.bookings[0].persons = maxCapacity
      }

      if (this.group.enabled || (groupEnabled && !this.$root.settings.appointments.allowBookingIfNotMin && minCapacity > 1)) {
        this.group.enabled = groupEnabled
      }

      if (groupEnabled && !this.$root.settings.appointments.allowBookingIfNotMin && minCapacity > 1) {
        this.appointment.bookings[0].persons = minCapacity
      }

      this.group.allowed = groupEnabled && (this.$root.settings.appointments.allowBookingIfNotMin || minCapacity === 1)

      if (!enabledGroup && this.$root.settings.appointments.allowBookingIfNotMin && this.$root.settings.appointments.openedBookingAfterMin && serviceMinCapacity > 1) {
        this.group.enabled = true
        this.appointment.bookings[0].persons = serviceMinCapacity
      }
    },

    getAppointmentAddToCalendarData (responseData, skipNotify) {
      let bookingId = 0

      let dates = []

      let bookings = []
      let bookingsIds = []

      switch (responseData.type) {
        case ('appointment'):
          responseData.recurring.forEach(function (recurringData) {
            bookings.push(
              {
                type: 'appointment',
                id: recurringData.booking.id,
                appointmentStatusChanged: recurringData.appointmentStatusChanged
              }
            )

            bookingsIds.push(recurringData.booking.id)
          })

          responseData.utcTime.forEach(function (date) {
            dates.push(
              {
                address: responseData.appointment.location ? responseData.appointment.location.address : '',
                start: moment.utc(date.start.replace(/ /g, 'T')).toDate(),
                end: moment.utc(date.end.replace(/ /g, 'T')).toDate()
              }
            )
          })

          responseData.recurring.forEach(function (recurringData) {
            recurringData.utcTime.forEach(function (date) {
              dates.push(
                {
                  address: recurringData.appointment.location ? recurringData.appointment.location.address : '',
                  start: moment.utc(date.start.replace(/ /g, 'T')).toDate(),
                  end: moment.utc(date.end.replace(/ /g, 'T')).toDate()
                }
              )
            })
          })

          bookingId = responseData.booking.id

          break

        case ('package'):
          responseData.package.forEach(function (packData, index) {
            if (index > 0) {
              bookings.push(
                {
                  type: 'appointment',
                  id: packData.booking.id,
                  appointmentStatusChanged: packData.appointmentStatusChanged
                }
              )

              bookingsIds.push(packData.booking.id)

              packData.utcTime.forEach(function (date) {
                dates.push(
                  {
                    address: packData.appointment.location ? packData.appointment.location.address : '',
                    start: moment.utc(date.start.replace(/ /g, 'T')).toDate(),
                    end: moment.utc(date.end.replace(/ /g, 'T')).toDate()
                  }
                )
              })
            } else {
              bookingId = packData.booking.id

              packData.utcTime.forEach(function (date) {
                dates.push(
                  {
                    address: packData.appointment.location ? packData.appointment.location.address : '',
                    start: moment.utc(date.start.replace(/ /g, 'T')).toDate(),
                    end: moment.utc(date.end.replace(/ /g, 'T')).toDate()
                  }
                )
              })
            }
          })

          break
      }

      let packageId = responseData.packageId ? responseData.packageId : null

      if (!skipNotify) {
        this.$http.post(`${this.$root.getAjaxUrl}/bookings/success/` + bookingId + '&nocache=' + (new Date().getTime()), {
          type: responseData.type,
          appointmentStatusChanged: responseData.appointmentStatusChanged,
          recurring: bookings,
          packageId: packageId,
          customer: responseData.customer,
          paymentId: 'paymentId' in responseData && responseData.paymentId ? responseData.paymentId : null,
          packageCustomerId: 'packageCustomerId' in responseData && responseData.packageCustomerId ? responseData.packageCustomerId : null
        }).then(response => {
        }).catch(e => {
        })
      }

      let addToCalendarData = {}

      switch (responseData.type) {
        case ('appointment'):
          addToCalendarData = {
            title: this.$root.useTranslations ? this.getNameTranslated(responseData.bookable) : responseData.bookable.name,
            dates: dates,
            address: responseData.appointment.location ? responseData.appointment.location.address : '',
            description: this.$root.useTranslations ? this.getDescriptionTranslated(responseData.bookable) : responseData.bookable.description,
            id: responseData.booking.id,
            status: responseData.appointment.bookings[0].status,
            active: this.$root.settings.general.addToCalendar,
            color: responseData.color,
            type: responseData.type,
            bookableType: responseData.type,
            bookable: responseData.bookable,
            booking: responseData.booking,
            recurringIds: bookingsIds
          }

          break

        case ('package'):
          addToCalendarData = {
            title: this.$root.useTranslations ? this.getNameTranslated(responseData.bookable) : responseData.bookable.name,
            dates: dates,
            address: '',
            description: this.$root.useTranslations ? this.getDescriptionTranslated(responseData.bookable) : responseData.bookable.description,
            id: bookingId,
            status: 'approved',
            active: this.$root.settings.general.addToCalendar && dates.length > 0,
            color: responseData.color,
            type: 'appointment',
            bookableType: 'package',
            bookable: responseData.bookable,
            booking: responseData.booking,
            recurringIds: bookingsIds
          }

          break
      }

      return addToCalendarData
    }

  }

}
