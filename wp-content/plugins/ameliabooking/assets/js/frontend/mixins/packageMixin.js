import moment from 'moment'

export default {

  mixins: [],

  data () {
    return {
      selectedPackageId: null,
      packageSlotsFetched: 0,
      packageServiceSelected: 0,
      selectedPackage: null,
      activePackage: false,
      packageListShown: false,
      packageCreated: false,
      disableFetchPackageSlots: false
    }
  },

  methods: {
    getPackagePrice (pack) {
      return pack.calculatedPrice ? pack.price : pack.price - pack.price / 100 * pack.discount
    },

    packageSlotsFetchedCallback () {
      this.packageSlotsFetched++

      if (this.passedPackage) {
        this.fetched = true
      }
    },

    getAvailablePackages () {
      return this.options.entities.packages.filter(
        pack => pack.availableBookableInfo.filter(bookable => bookable.serviceId === this.appointment.serviceId).length > 0
      ).sort((a, b) => a.position - b.position)
    },

    initPackage (selectedPackage) {
      this.selectedPackage = selectedPackage

      this.selectedPackage.bookable.forEach(function (bookable) {
        bookable.bookings = []

        bookable.bookings.push({
          cleared: false,
          date: null,
          time: null,
          providerId: null,
          locationId: null,
          slots: []
        })

        bookable.calendarData = {
          slotsIndexStarted: 0,
          clonedSlotsData: null,
          slotsData: null,
          disabledWeekdays: null,
          availableDates: null,
          availableTimeSlots: [],
          selectedWeekIndex: 0
        }
      })
    },

    selectPackage (selectedPackage) {
      let amContainer = document.getElementById(this.id)

      this.activePicker = false
      amContainer.classList.remove('am-active-picker')

      this.activeRecurringDates = false
      this.activeRecurringSetup = false
      this.activeRecurring = false
      this.calendarVisible = false
      this.packageCalendarActive = true

      this.initPackage(selectedPackage)

      this.getCurrentUser()

      this.activePackage = true
    },

    closePackage () {
      this.selectedPackage = null
      this.activePackage = false
      this.packageCreated = false
      this.packageCalendarActive = false

      if (this.selectedPackageId === null) {
        this.updateSettings(this.getServiceById(this.appointment.serviceId).settings)
      }

      let amContainer = document.getElementById(this.id)

      if (!this.fetchedSlots) {
        amContainer.classList.remove('am-active-picker')
      }

      setTimeout(() => {
        this.times = document.getElementById(this.calendarId)
      }, 200)
    },

    getPackageAppointmentsData () {
      let bookings = []

      let rules = []

      if (this.selectedPackage) {
        this.selectedPackage.bookable.forEach((bookable) => {
          bookable.bookings.forEach((booking) => {
            if (booking.date && booking.time) {
              bookings.push({
                bookingStart: moment(booking.date).format('YYYY-MM-DD') + ' ' + booking.time,
                serviceId: bookable.service.id,
                providerId: booking.providerId,
                locationId: booking.locationId
              })
            }
          })

          rules.push({
            serviceId: bookable.service.id,
            providerId: bookable.providerId ? bookable.providerId : null,
            locationId: bookable.locationId ? bookable.locationId : null
          })
        })
      }

      return {
        id: this.selectedPackage ? this.selectedPackage.id : null,
        data: bookings,
        rules: rules
      }
    },

    packageListShow () {
      this.loading = false
      this.activePackage = false
      this.packageListShown = true

      let amContainer = document.getElementById(this.id)

      amContainer.classList.toggle('am-active-package-list', true)
      amContainer.classList.toggle('am-active-picker', false)

      amContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    },

    packageSlotsSelectedCallback () {
      this.appointment.bookings[0].extras = []

      this.updateSettings(this.getPackageById(this.selectedPackage.id).settings)

      let amContainer = document.getElementById(this.id)

      this.loading = false
      this.packageCreated = false
      this.packageListShown = false
      this.activeConfirm = true
      this.packageCreated = true

      amContainer.classList.remove('am-active-package-list')

      amContainer.classList.toggle('am-active-confirm', this.activeConfirm)
    },

    bookingPackageDataCompiler (dataArray) {
      let bookingData = []
      dataArray.forEach((booking) => {
        if (booking.date && booking.time) {
          bookingData.push({
            date: booking.date,
            time: booking.time,
            provider: this.getProviderById(booking.providerId) || this.responseEntities.employees.filter(emp => emp.id === booking.providerId)[0],
            location: booking.locationId ? this.getLocationById(booking.locationId) : null
          })
        }
      })

      return bookingData
    },

    getBookablePackageData () {
      let bookings = []

      let hasLocation = this.options.entities.locations.length > 0

      this.selectedPackage.bookable.forEach((bookable) => {
        let serviceAppointment = this.bookingPackageDataCompiler(bookable.bookings)

        let spanLengths = hasLocation ? {
          appointment: 1,
          date: 7,
          time: 4,
          employee: 6,
          location: 6
        } : {
          appointment: 1,
          date: 9,
          time: 6,
          employee: 8,
          location: 0
        }

        bookings.push({
          serviceName: bookable.service.name,
          serviceQuantity: bookable.quantity,
          serviceAppointment: serviceAppointment,
          serviceDuration: bookable.service.duration,
          service: bookable.service,
          spanLengths: spanLengths,
          hasLocations: hasLocation,
          singleEmployee: null,
          singleLocation: null
        })
      })

      return {
        name: this.selectedPackage.name,
        color: this.selectedPackage.color,
        discount: this.selectedPackage.discount,
        description: this.selectedPackage.description,
        price: this.getPackagePrice(this.selectedPackage),
        pictureThumbPath: this.selectedPackage.pictureThumbPath,
        durationCount: this.selectedPackage.durationCount,
        durationType: this.selectedPackage.durationType,
        endDate: this.selectedPackage.endDate,
        bookings: bookings,
        translations: this.selectedPackage.translations
      }
    },

    getAppointmentCount () {
      let count = 0
      this.purchasedPackage.bookable.forEach(b => {
        count += b.quantity
      })
      return count
    },

    allCanceled (appointments) {
      let canceled = appointments.filter(b => b.booking.status === 'canceled').length
      return appointments.length > 0 && appointments.length === canceled
    },

    parsePackageAppointments (availablePackageBookings, appointments, timeZone) {
      let availability = availablePackageBookings.find(customerData => customerData.customerId === this.state.profile.id)

      if (typeof availability === 'undefined' || !availability) {
        availability = {packages: []}
      }

      this.packagesAppointments = this.parseAppointments(appointments, timeZone)
      this.packagesAvailability = availability ? availability.packages : []

      const packageData = []

      availability.packages.forEach((packageItemAvailable) => {
        let packageItem = this.getPackageById(packageItemAvailable.packageId)

        let currentPackageServicesIds = packageItem.bookable.map(bookableData => bookableData.service.id)

        packageItemAvailable.services.forEach((availableServiceData) => {
          if (currentPackageServicesIds.indexOf(availableServiceData.serviceId) === -1) {
            let oldPackageBookable = {}

            oldPackageBookable.providers = []

            oldPackageBookable.locations = []

            availableServiceData.bookings.forEach((bookingData) => {
              if (bookingData.providerId) {
                oldPackageBookable.providers.push(bookingData.providerId)
              }

              if (bookingData.locationId) {
                oldPackageBookable.locations.push(bookingData.locationId)
              }
            })

            oldPackageBookable.service = this.getServiceById(availableServiceData.serviceId)

            packageItem.bookable.push(oldPackageBookable)
          }
        })
      })

      this.options.entities.packages.forEach((packageItem) => {
        availability.packages.forEach((packageItemAvailable) => {
          if (packageItem.id === packageItemAvailable.packageId) {
            let totalAvailable = 0

            let expireDateString = null

            packageItem.bookable.forEach((packageService) => {
              packageService.providers = []
              packageService.locations = []
              packageService.appointmentServiceIds = []

              packageItemAvailable.services.forEach((availableServices) => {
                let quantity = 0
                let totalServicesCount = {}

                availableServices.bookings.forEach((bookingData) => {
                  quantity += bookingData.count

                  if (!(availableServices.serviceId in totalServicesCount)) {
                    totalServicesCount[availableServices.serviceId] = 0
                  }

                  totalServicesCount[availableServices.serviceId] += bookingData.total

                  if (expireDateString === null || moment(bookingData.end).isAfter(moment(expireDateString))) {
                    expireDateString = bookingData.end
                  }

                  if (bookingData.employeeId &&
                      packageService.providers.map(provider => provider.id).indexOf(bookingData.employeeId) === -1
                  ) {
                    packageService.providers.push(this.getProviderById(bookingData.employeeId))
                  }

                  if (bookingData.locationId &&
                      packageService.locations.map(location => location.id).indexOf(bookingData.locationId) === -1
                  ) {
                    packageService.locations.push(this.getLocationById(bookingData.locationId))
                  }

                  packageService.appointmentServiceIds.push(bookingData.id)
                })

                if (packageService.service.id === availableServices.serviceId) {
                  packageService.service.appointmentsAvailable = quantity
                  packageService.service.total = (availableServices.serviceId in totalServicesCount) ? totalServicesCount[availableServices.serviceId] : 0
                  totalAvailable += quantity
                }
              })

              const packageServiceAppointment = []

              Object.values(this.packagesAppointments).forEach((appointmentsDateGroup) => {
                appointmentsDateGroup.appointments.forEach((packageAppointment) => {
                  packageAppointment.bookings.forEach((booking) => {
                    if (packageService.appointmentServiceIds.indexOf(booking.packageCustomerService.id) !== -1 &&
                        packageAppointment.serviceId === packageService.service.id
                    ) {
                      packageServiceAppointment.push(packageAppointment)
                    }
                  })
                })
              })

              packageServiceAppointment.sort((a, b) => b.id - a.id)
              packageService.service.bookedAppointments = packageServiceAppointment
            })

            packageItem.totalAvailableAppointments = totalAvailable
            packageItem.expireDateString = expireDateString
            packageData.push(packageItem)
          }
        })
      })

      packageData.forEach((data) => {
        if (!('purchases' in data)) {
          data.purchases = {}
        }

        this.packagesAvailability.find(item => item.packageId === data.id).services.forEach((service) => {
          service.bookings.forEach((purchase) => {
            if (!(purchase.id in data.purchases)) {
              data.purchases[purchase.id] = purchase
            }

            if (purchase.status === 'canceled') {
              data.totalAvailableAppointments = data.totalAvailableAppointments - purchase.count

              let bookableData = data.bookable.find(bookable => bookable.service.id === service.serviceId)

              if (bookableData && typeof bookableData !== 'undefined') {
                bookableData.service.appointmentsAvailable = bookableData.service.appointmentsAvailable - purchase.count

                bookableData.service.total = bookableData.service.total - purchase.total
              }
            }
          })
        })
      })

      this.packagesData = packageData
    },

    packagePurchaseHasAppointments (packageCustomer) {
      return packageCustomer.appointments.filter(a => a.id !== null).length > 0
    },

    parseAppointments (appointments, timeZone) {
      if (Object.keys(appointments).length === 0) {
        return {}
      }

      for (let key in appointments) {
        if (appointments.hasOwnProperty(key)) {
          appointments[key].appointments.forEach(appointment => {
            let appointmentCustomerBookings = {}

            appointment.bookings.forEach((booking) => {
              if (!(booking.customerId in appointmentCustomerBookings)) {
                appointmentCustomerBookings[booking.customerId] = []
              }

              appointmentCustomerBookings[booking.customerId][booking.id] = booking.status
            })

            let customerBookings = {}

            for (let customerId in appointmentCustomerBookings) {
              for (let bookingId in appointmentCustomerBookings[customerId]) {
                if (!(customerId in customerBookings) ||
                  (appointmentCustomerBookings[customerId][bookingId] === 'approved' || appointmentCustomerBookings[customerId][bookingId] === 'pending')
                ) {
                  customerBookings[customerId] = bookingId
                }
              }
            }

            appointment.bookings.forEach(booking => {
              if (booking.customerId in customerBookings &&
                parseInt(booking.id) !== parseInt(customerBookings[booking.customerId])
              ) {
                return
              }

              if (timeZone === '') {
                appointment.bookingStart = this.getConvertedUtcToLocalDateTime(appointment.bookingStart)
                appointment.bookingEnd = this.getConvertedUtcToLocalDateTime(appointment.bookingEnd)
              }

              appointment.loadingTimeSlots = false
              if (this.state && this.state.cabinetType === 'customer') {
                appointment.bookings = [booking]
              }
            })
          })
        }
      }

      if (timeZone === '') {
        let parsedGroupedAppointments = {}

        for (let key in appointments) {
          if (appointments.hasOwnProperty(key)) {
            appointments[key].appointments.forEach(appointment => {
              let appointmentDateString = appointment.bookingStart.split(' ')[0]

              if (!(appointmentDateString in parsedGroupedAppointments)) {
                parsedGroupedAppointments[appointmentDateString] = {
                  appointments: [appointment],
                  date: appointmentDateString
                }
              } else {
                parsedGroupedAppointments[appointmentDateString].appointments.push(appointment)
              }
            })
          }
        }

        return parsedGroupedAppointments
      }

      return appointments
    }

  }

}
