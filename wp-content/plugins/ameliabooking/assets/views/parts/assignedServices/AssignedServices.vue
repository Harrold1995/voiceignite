<template>

  <!-- Assigned Services -->
  <div>
    <div
        class="am-dialog-table am-assigned-services"
        v-for="category in categorizedServiceList"
        v-if="category.serviceList.length > 0"
        :key="category.id"
    >

      <!-- Header -->
      <el-row :gutter="24" class="am-dialog-table-head">

        <!-- Category Name -->
        <el-col class="am-three-dots" :span="12">
          <el-checkbox
              v-model="category.state"
              @change="changeCategory(category.id)"
          >
          </el-checkbox>
          <span>{{ category.name }}</span>
        </el-col>
        <!-- /Category Name -->

        <!-- Price Label -->
        <el-col :span="6">
          {{ $root.labels.price }}
        </el-col>
        <!-- /Price Label -->

        <!-- Capacity Label -->
        <el-col :span="6">
          {{ $root.labels.capacity }}
        </el-col>
        <!-- /Capacity Label -->

      </el-row>
      <!-- /Header -->

      <!-- Body -->
      <el-row
          class="am-assigned-services__service-row" :gutter="10" type="flex" align="middle"
          v-for="item in category.serviceList" :key="item.value"
      >

        <!-- Service Name -->
        <el-col :span="12" class="am-assigned-services__service-row__name">
          <el-checkbox
              v-model="item.state"
              @change="changeService(category, item)"
          >
          </el-checkbox>
          <span :title="item.name">{{ item.name }}</span>
        </el-col>
        <!-- /Service Name -->

        <!-- Service Price -->
        <el-col :span="6">
          <p style="display: none;">{{ $root.labels.price }}</p>
          <money
              v-model="item.price"
              v-bind="moneyComponentData"
              class="el-input__inner"
              :disabled="!item.state"
          >
          </money>
        </el-col>
        <!-- /Service Price -->

        <!-- Min. Capacity -->
        <el-col :span="3">
          <p style="display: none;">{{ $root.labels.minimum_capacity }}</p>
          <el-popover :disabled="!$root.isLite" ref="minCapacityPop" v-bind="$root.popLiteProps"><PopLite/></el-popover>
          <el-input-number
              v-model="item.minCapacity"
              :disabled="!item.state || $root.isLite"
              :value="item.minCapacity"
              :min="1"
              @input="checkCapacityLimits(item)"
              :controls=false
          >
          </el-input-number>
        </el-col>
        <!-- /Min. Capacity -->

        <!-- Max. Capacity -->
        <el-col :span="3">
          <p style="display: none;">{{ $root.labels.maximum_capacity }}</p>
          <el-popover :disabled="!$root.isLite" ref="maxCapacityPop" v-bind="$root.popLiteProps"><PopLite/></el-popover>
          <el-input-number
              v-model="item.maxCapacity"
              :disabled="!item.state || $root.isLite"
              :value="item.maxCapacity"
              :min="item.minCapacity"
              @input="checkCapacityLimits(item)"
              :controls=false
          >
          </el-input-number>
        </el-col>
        <!-- /Max. Capacity -->

      </el-row>
      <!-- /Body -->

    </div>
  </div>
  <!-- /Assigned Services -->

</template>

<script>
  import notifyMixin from '../../../js/backend/mixins/notifyMixin'
  import priceMixin from '../../../js/common/mixins/priceMixin'
  import { Money } from 'v-money'

  export default {
    name: 'AssignedServices',

    components: {
      Money
    },

    mixins: [
      notifyMixin,
      priceMixin
    ],

    props: {
      categorizedServiceList: {
        type: Array,
        default: () => ([])
      },
      weekSchedule: {
        type: Array,
        default: () => ([])
      },
      futureAppointments: {
        type: Object,
        default: () => ({})
      },
      employeeId: {
        type: Number,
        default: 0
      }
    },

    created () {
      this.categorizedServiceList.forEach((catItem) => {
        this.handleCheckSingleInCategory(catItem)
      })
    },

    methods: {
      changeCategory (categoryId) {
        let category = this.categorizedServiceList.find(category => category.id === categoryId)

        category.serviceList.forEach((service) => {
          if (Object.keys(this.futureAppointments).length !== 0 && this.futureAppointments[this.employeeId] !== undefined && this.futureAppointments[this.employeeId].indexOf(service.id) !== -1 && category.state === false) {
            this.notify(
              this.$root.labels.error,
              this.$root.labels.service_provider_remove_fail_all + ' ' + service.name + ' ' + this.$root.labels.service,
              'error'
            )
          } else {
            service.state = category.state
            this.changeSelectedPeriodServices(service)
          }
        })
      },

      changeService (category, service) {
        if (Object.keys(this.futureAppointments).length !== 0 && this.futureAppointments[this.employeeId] !== undefined && this.futureAppointments[this.employeeId].indexOf(service.id) !== -1) {
          service.state = true
          this.notify(this.$root.labels.error, this.$root.labels.service_provider_remove_fail, 'error')
        }

        this.changeSelectedPeriodServices(service)
        this.handleCheckSingleInCategory(category)
      },

      handleCheckSingleInCategory (category) {
        category.state = category.serviceList.filter(service => service.state === true).length === category.serviceList.length
      },

      checkCapacityLimits (item) {
        if (item.minCapacity > item.maxCapacity) {
          item.maxCapacity = item.minCapacity
        }
      },

      changeSelectedPeriodServices (service) {
        if (service.state) {
          // set to old state if period is already saved
          this.weekSchedule.forEach((weekDay) => {
            weekDay.periods.forEach((period) => {
              if ('savedPeriodServiceList' in period) {
                period.savedPeriodServiceList.forEach((savedPeriodService) => {
                  if (savedPeriodService.serviceId === service.id) {
                    period.periodServiceList.push(savedPeriodService)
                    period.serviceIds.push(service.id)
                  }
                })
              }
            })
          })
        } else {
          this.weekSchedule.forEach(weekDay => {
            weekDay.periods.forEach(period => {
              period.periodServiceList.forEach((periodService, index) => {
                if (periodService.serviceId === service.id) {
                  period.periodServiceList.splice(index, 1)
                }
              })

              period.serviceIds.forEach((serviceId, index) => {
                if (serviceId === service.id) {
                  period.serviceIds.splice(index, 1)
                }
              })
            })
          })
        }
      }
    }
  }
</script>
