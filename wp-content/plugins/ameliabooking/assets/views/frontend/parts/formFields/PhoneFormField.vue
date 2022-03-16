<template>
  <!-- User Phone -->
  <el-col :sm="columnsLg" ref="customer.phone" v-if="formField.visibility">
    <el-form-item
      prop="customer.phone"
      :label="firstNameLabel || $root.labels.phone_colon"
      :class="$root.settings.customization.forms ? `am-input-${classIdentifier}`: ''"
      :error="errors.phone"
    >
      <phone-input
        :dropdown-class="`am-dropdown-${classIdentifier}`"
        :savedPhone="appointment.bookings[0].customer.phone"
        :disabled="!!appointment.bookings[0].customer.id && phonePopulated === true"
        :countryPhoneIso="appointment.bookings[0].customer.countryPhoneIso"
        @keyup.native="inputChanges"
        v-on:phoneFormatted="phoneFormatted"
      >
      </phone-input>
    </el-form-item>
  </el-col>
  <!-- /User Phone -->
</template>

<script>
import phoneInput from '../../../parts/PhoneInput'

export default {
  name: 'phoneFormField',

  components: {
    phoneInput
  },

  props: {
    appointment: {
      type: Object,
      default: () => {}
    },
    columnsLg: {
      type: Number,
      default: 12
    },
    formValidOptions: {
      type: Object,
      default: () => {}
    },
    errors: {
      type: Object,
      default: () => {}
    },
    phonePopulated: {
      type: Boolean,
      default: null
    },
    classIdentifier: {
      type: String,
      default: ''
    },
    formField: {
      type: Object,
      default: () => {}
    }
  },

  data () {
    return {
      firstNameLabel: this.formField.labels.phone_colon.value
    }
  },

  methods: {
    inputChanges () {
      this.$emit('inputChanges')
    },

    phoneFormatted (phone, countryPhoneIso) {
      this.appointment.bookings[0].customer.phone = phone
      this.appointment.bookings[0].customer.countryPhoneIso = countryPhoneIso
    }
  },

  watch: {
    'formValidOptions' () {
      if (this.formValidOptions['customer.phone']) {
        this.$refs['customer.phone'].$el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }
  }
}
</script>
