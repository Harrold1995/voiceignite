import moment from 'moment'

export default {
  methods: {
    selectedTicketsCount (bookingToEventTickets) {
      let sum = 0

      bookingToEventTickets.forEach((item) => {
        sum += item.persons
      })

      return sum
    },

    entitiesLoaded () {
      return 'ameliaEventEntities' in window || 'ameliaEntities' in window
    },

    processEntities (entities) {
      this.getCurrentUser()

      this.options.entities.locations = entities.locations.filter(location => location.status !== 'hidden')
      this.options.entities.employees = entities.employees
      this.options.entities.customFields = entities.customFields

      this.options.entities.employees.forEach((employee) => {
        employee.serviceList.forEach((service) => {
          if (!('name' in service)) {
            Object.assign(
              service,
              {extras: []}
            )
          }
        })
      })

      if (this.$root.useTranslations) {
        this.translateEntities(this.options.entities)
      }

      this.setBookingCustomFields()
    },

    processCalendarEntities (entities) {
      this.processEntities(entities)

      this.options.entities.tags = entities.tags

      let preselectedTag = this.getPreselectedTag()

      if (preselectedTag) {
        let tag = entities.tags.find(tag => tag.name === preselectedTag)

        this.options.entities.tags = tag ? [tag] : entities.tags
        this.eventFilterTag = tag ? [tag.name] : []
      } else {
        this.options.entities.tags = entities.tags
      }

      this.entitiesFetched = true

      this.getEvents()
    },

    processListEntities (entities) {
      this.processEntities(entities)

      this.options.entities.tags = this.getPreselectedTag() ? [] : entities.tags
    },

    getEntities (callback) {
      if (this.$root.hasApiCall && !this.entitiesLoaded()) {
        this.$http.get(`${this.$root.getAjaxUrl}/entities`, {
          params: {
            types: ['locations', 'tags', 'custom_fields', 'employees']
          }
        }).then(response => {
          window.ameliaEventEntities = JSON.parse(JSON.stringify(response.data.data))

          callback(window.ameliaEventEntities)
        }).catch(() => {
        })
      } else {
        let ameliaApiInterval = setInterval(
          () => {
            if (this.entitiesLoaded()) {
              clearInterval(ameliaApiInterval)

              if ('ameliaEntities' in window) {
                callback(JSON.parse(JSON.stringify(window.ameliaEntities)))
              } else {
                callback(JSON.parse(JSON.stringify(window.ameliaEventEntities)))
              }
            }
          },
          1000
        )
      }
    },

    getPreselectedTag () {
      return 'eventTag' in this.$root.shortcodeData.booking ? this.$root.shortcodeData.booking.eventTag : null
    },

    getPreselectedEmployee () {
      return 'eventTag' in this.$root.shortcodeData.booking ? this.$root.shortcodeData.booking.employee : null
    },

    getPreselectedEventId () {
      return 'eventId' in this.$root.shortcodeData.booking ? this.$root.shortcodeData.booking.eventId : null
    },

    getPreselectedEventRecurring () {
      return 'eventRecurring' in this.$root.shortcodeData.booking ? this.$root.shortcodeData.booking.eventRecurring : null
    },

    getImplodedPeriods (eventPeriods) {
      let lastPeriod = null

      let parsedPeriods = []

      let result = []

      eventPeriods.forEach(function (period, index) {
        let isConnectedPeriod = (lastPeriod && lastPeriod.periodEnd === period.periodStart)

        if (isConnectedPeriod) {
          parsedPeriods.pop()
        }

        lastPeriod = {
          periodStart: isConnectedPeriod ? lastPeriod.periodStart : period.periodStart,
          periodEnd: period.periodEnd,
          isConnected: isConnectedPeriod
        }

        parsedPeriods.push(lastPeriod)

        if (eventPeriods.length === index + 1 || (index + 1 in eventPeriods && eventPeriods[index + 1].periodStart !== period.periodEnd)) {
          result = result.concat(JSON.parse(JSON.stringify(parsedPeriods)))
          parsedPeriods = []
        }
      })

      return result
    },

    getExplodedPeriods (connectedPeriods) {
      let result = []

      connectedPeriods.forEach(function (period) {
        if (!period.isConnected) {
          let startDate = moment(period.periodStart.split(' ')[0], 'YYYY-MM-DD')
          let endDate = moment(period.periodEnd.split(' ')[0], 'YYYY-MM-DD')

          let startTime = period.periodStart.split(' ')[1]
          let endTime = period.periodEnd.split(' ')[1]

          if (endTime === '00:00:00') {
            endTime = '24:00:00'
            endDate.subtract(1, 'days')
          }

          let periodDates = []

          while (startDate.isSameOrBefore(endDate)) {
            periodDates.push(startDate.format('YYYY-MM-DD'))

            startDate.add(1, 'days')
          }

          periodDates.forEach(function (dateString) {
            result.push({
              periodStart: dateString + ' ' + startTime,
              periodEnd: dateString + ' ' + endTime,
              zoomMeeting: period.zoomMeeting,
              lessonSpace: period.lessonSpace
            })
          })
        } else {
          result.push(period)
        }
      })

      return result
    },

    getEventStatus (evt) {
      switch (evt.status) {
        case ('rejected'):
        case ('canceled'):
          return {
            'label': this.$root.labels.canceled,
            'class': 'canceled'
          }
        case ('full'):
          return {
            'label': this.$root.labels.full,
            'class': 'full'
          }
        case ('upcoming'):
          return {
            'label': this.$root.labels.upcoming,
            'class': 'upcoming'
          }
        case ('approved'):
          if (evt.closed) {
            return {
              'label': this.$root.labels.closed,
              'class': 'closed'
            }
          }

          if (evt.opened && evt.places > 0) {
            return {
              'label': this.$root.labels.opened,
              'class': 'opened'
            }
          }
      }

      return {
        'label': '',
        'class': ''
      }
    },

    getEventAddToCalendarData (responseData, skipNotify) {
      if (!skipNotify) {
        this.$http.post(`${this.$root.getAjaxUrl}/bookings/success/` + responseData.booking.id, {
          type: 'event',
          appointmentStatusChanged: responseData.appointmentStatusChanged,
          paymentId: 'paymentId' in responseData && responseData.paymentId ? responseData.paymentId : null,
          packageCustomerId: null
        }).then(response => {
        }).catch(e => {
        })
      }

      let locationAddress = ''

      if (responseData.event.location) {
        locationAddress = responseData.event.location.address
      } else if (responseData.event.customLocation) {
        locationAddress = responseData.event.customLocation
      }

      let dates = []

      responseData.utcTime.forEach(function (date) {
        dates.push(
          {
            address: locationAddress,
            start: moment.utc(date.start.replace(/ /g, 'T')).toDate(),
            end: moment.utc(date.end.replace(/ /g, 'T')).toDate()
          }
        )
      })

      return {
        title: this.$root.useTranslations ? this.getNameTranslated(responseData.event) : responseData.event.name,
        dates: dates,
        address: locationAddress,
        description: this.$root.useTranslations ? this.getDescriptionTranslated(responseData.event) : responseData.event.description,
        id: responseData.booking.id,
        status: responseData.booking.status,
        active: this.$root.settings.general.addToCalendar,
        color: responseData.color,
        type: responseData.type,
        bookableType: responseData.type,
        bookable: responseData.event,
        booking: responseData.booking,
        recurringIds: []
      }
    }
  }
}
