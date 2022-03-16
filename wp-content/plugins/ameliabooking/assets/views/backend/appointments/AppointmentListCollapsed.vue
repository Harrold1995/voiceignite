<template>
  <div>

    <!-- Collapsed Data For One Booking -->
    <div class="am-appointment-details">
      <el-row>

        <el-row
            class="has-divider am-appointment-id am-appointment-id-details"
        >

          <!-- Appointment ID Label -->
          <el-col :sm="5">
            <p class="am-data">{{ $root.labels.id }}:</p>
          </el-col>

          <!-- Appointment ID Value -->
          <el-col :sm="7">
            <p class="am-value">
              {{ app.id }}
            </p>
          </el-col>
        </el-row>

        <!-- Zoom -->
        <el-row v-if="app.zoomMeeting" class="am-zoom" :class="{ 'has-divider': $root.settings.role !== 'customer' }">
          <el-col :sm="12">
            <el-row v-if="$root.settings.role !== 'customer'">
              <el-col :sm="10" class="am-zoom-col-icon">
                <p class="am-data">{{ $root.labels.zoom_start_link }}:</p>
              </el-col>
              <el-col :sm="14">
                <p class="am-value"><a class="am-link"
                                       :href="app.zoomMeeting.startUrl">{{ $root.labels.zoom_click_to_start }}</a></p>
              </el-col>
            </el-row>
          </el-col>
          <el-col :sm="12">
            <el-row>
              <el-col :sm="10" class="am-zoom-col-icon">
                <p class="am-data">{{ $root.labels.zoom_join_link }}:</p>
              </el-col>
              <el-col :sm="14">
                <p class="am-value"><a class="am-link" :href="app.zoomMeeting.joinUrl">{{ $root.labels.zoom_click_to_join }}</a>
                </p>
              </el-col>
            </el-row>
          </el-col>
        </el-row>
        <!-- /Zoom -->

        <!-- Lesson Space -->
        <el-row v-if="app.lessonSpace" class="am-zoom has-divider">
          <el-col :sm="5" class="am-zoom-col-icon">
            <p class="am-data">{{ $root.labels.lesson_space_link }}:</p>
          </el-col>
          <el-col :sm="7">
            <p class="am-value">
              <a class="am-link" :href="app.lessonSpace">{{ $root.labels.lesson_space_join }}</a></p>
          </el-col>
        </el-row>
        <!-- /Lesson Space -->

        <!-- Customer Phone, Customer Email & Custom Fields -->
        <el-row
            v-for="(booking, key) in app.bookings"
            :key="key"
            :class="{ 'has-divider': app.bookings.length > 1 && (app.bookings.length !== key + 1 || app.internalNotes) }"
        >

          <!-- Customer Name -->
          <h3 v-if="app.bookings.length > 1">
            {{
              ((user = getCustomerById(booking.customerId)) !== null ? user.firstName + ' ' +
                  user.lastName : '')
            }}
          </h3>

          <!-- Customer Email -->
          <div v-if="$root.settings.role !== 'customer'" class="am-appointment-collapsed-field">

            <!-- Customer Email Label -->
            <el-col :sm="5">
              <p class="am-data">{{ $root.labels.customer_email }}:</p>
            </el-col>

            <!-- Customer Email Value -->
            <el-col :sm="7">
              <p class="am-value">
                {{ ((user = getCustomerById(app.bookings[key].customerId)) !== null ? user.email : '') }}
              </p>
            </el-col>

          </div>

          <!-- Customer Phone -->
          <div
              v-if="getCustomerInfo(app.bookings[key]) && getCustomerInfo(app.bookings[key]).phone && $root.settings.role !== 'customer'"
              class="am-appointment-collapsed-field"
          >

            <!-- Customer Phone Label -->
            <el-col :sm="5">
              <p class="am-data">{{ $root.labels.customer_phone }}:</p>
            </el-col>

            <!-- Customer Phone Value -->
            <el-col :sm="7">
              <p class="am-value">
                {{ getCustomerInfo(app.bookings[key]).phone }}
              </p>
            </el-col>

          </div>

          <!-- Custom Fields -->
          <div v-for="(customField, customFieldId) in JSON.parse(app.bookings[key].customFields)"
               v-if="customField && showCustomField(customField.value)"
               class="am-appointment-collapsed-field"
          >

            <!-- Custom Field Label -->
            <el-col :sm="5">
              <p class="am-data" v-html="getCustomFieldLabel(customField, customFieldId) + ':'"></p>
            </el-col>

            <!-- Custom Field Value -->
            <el-col :sm="7">
              <p v-if="customField.type !== 'file'" class="am-value">
                {{ customField ? getCustomFieldValue(customField.value, customField.type) : '' }}
              </p>
              <div v-else>
                <p v-for="(fileInfo, index) in customField.value" class="am-link">
                  <a
                      :key="index"
                      :href="$root.useUploadsAmeliaPath ? $root.getAjaxUrl + '/fields/' + customFieldId + '/' + app.bookings[key].id + '/' + index : $root.getUploadsAmeliaUrl + app.bookings[key].id + '_' + fileInfo.fileName"
                      target="_blank"
                  >
                    {{ fileInfo.name }}
                  </a>
                </p>
              </div>
            </el-col>

          </div>

          <!-- Extras -->
          <div v-for="customerExtra in app.bookings[key].extras" class="am-appointment-collapsed-field">

            <!-- Extra Name -->
            <el-col :sm="5">
              <p class="am-data">
                {{ getServiceById(app.serviceId).extras.find(extra => extra.id === customerExtra.extraId).name }}
              </p>
            </el-col>
            <!-- /Extra Name -->

            <!-- Extra Quantity & Price -->
            <el-col :sm="7">
              <p class="am-value">
                {{ customerExtra.quantity }}
              </p>
            </el-col>
            <!-- /Extra Quantity & Price -->

          </div>
          <!-- /Extras -->

        </el-row>

        <!-- Note -->
        <el-row v-if="app.internalNotes && $root.settings.role !== 'customer'">
          <el-col :sm="12">
            <el-row>

              <!-- Note Label -->
              <el-col :sm="10">
                <p class="am-data">{{ $root.labels.note }}:</p>
              </el-col>

              <!-- Note Value -->
              <el-col :sm="14">
                <p class="am-value">{{ app.internalNotes }}</p>
              </el-col>

            </el-row>
          </el-col>
        </el-row>

      </el-row>
    </div>

  </div>
</template>

<script>
import entitiesMixin from '../../../js/common/mixins/entitiesMixin'
import priceMixin from '../../../js/common/mixins/priceMixin'
import dateMixin from '../../../js/common/mixins/dateMixin'
import customFieldMixin from '../../../js/common/mixins/customFieldMixin'

export default {
  mixins: [entitiesMixin, priceMixin, dateMixin, customFieldMixin],

  props: [
    'app',
    'options'
  ],

  data () {
    return {}
  },

  methods: {
    getCustomFieldLabel (customField, customFieldId) {
      let savedCustomField = this.options.entities.customFields.find(customField => customField.id === parseInt(customFieldId))

      return typeof savedCustomField !== 'undefined' ? savedCustomField.label.trim() : customField.label.trim()
    },

    showCustomField (value) {
      if (Array.isArray(value)) {
        return value.length > 0
      }

      return !!value
    }
  }
}
</script>
