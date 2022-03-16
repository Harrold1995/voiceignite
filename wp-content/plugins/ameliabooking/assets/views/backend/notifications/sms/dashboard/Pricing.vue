<template>
  <div class="am-sms-pricelist">

    <!-- Pricing Title -->
    <h2>{{ $root.labels.pricing }}</h2>
    <!-- /Pricing Title -->

    <!-- Select Country Title -->
    <p>{{ $root.labels.view_pricing_for }}</p>
    <!-- /Select Country Title -->

    <!-- Select Country Select -->
    <el-form>
      <el-form-item>
        <el-select
            v-model="getCountryPriceList.selectedCountry"
            placeholder=""
            :disabled="fetched === false"
            @change="changeCountry"
            :class="'am-selected-flag am-selected-flag-' + getCountryPriceList.selectedCountry"
        >
          <el-option
              v-for="country in countries"
              :key="country.id"
              :label="country.nicename"
              :value="country.iso"
          >
            <span :class="'am-flag am-flag-'+country.iso"></span>
            <span style="float: left">{{ country.nicename }}</span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <!-- /Select Country Select -->

    <!-- Pricing Table -->
    <div class="am-sms-country-pricelist" v-if="fetched && error === false">

      <!-- Pricing Table Header -->
      <div class="am-sms-country-pricelist-head">
        <el-row :gutter="10">

          <!-- Carrier -->
          <el-col :lg="12"><p>{{ $root.labels.carrier }}</p></el-col>
          <!-- /Carrier -->

          <!-- Price -->
          <el-col :lg="12"><p>{{ $root.labels.price }} / {{ $root.labels.message_colon }}</p></el-col>
          <!-- /Price -->

        </el-row>
      </div>
      <!-- /Pricing Table Header -->

      <!-- Pricing Table Body -->
      <div class="am-sms-country-pricelist-body">
        <div class="am-sms-country-price" v-for="carrier in carriers">
          <el-row :gutter="16">

            <!-- Carrier -->
            <el-col :lg="12"><span>{{ carrier.carrier }}</span></el-col>
            <!-- /Carrier -->

            <!-- Price -->
            <el-col :lg="12">
              <span>${{ getFormattedMessagePrice(carrier.price) }}</span>
            </el-col>
            <!-- /Price -->

          </el-row>
        </div>
      </div>
      <!-- /Pricing Table Body -->

    </div>
    <!-- /Pricing Table -->

    <!-- Spinner -->
    <div class="am-spinner am-section" v-if="!fetched">
      <img :src="$root.getUrl + 'public/img/spinner.svg'"/>
    </div>
    <!-- /Spinner -->

    <!-- Empty State For SMS -->
    <div class="am-empty-state am-section" v-show="error === true && fetched === true">
      <img :src="$root.getUrl + 'public/img/emptystate.svg'"/>
      <p>{{ $root.labels.no_results }}</p>
    </div>
    <!-- /Empty State For SMS -->

  </div>
</template>

<script>
  import phoneCountriesMixin from '../../../../../js/common/mixins/phoneCountriesMixin'
  import notificationMixin from '../../../../../js/backend/mixins/notificationMixin'
  import notifyMixin from '../../../../../js/backend/mixins/notifyMixin'

  export default {
    mixins: [notificationMixin, phoneCountriesMixin, notifyMixin],

    data () {
      return {
        carriers: [],
        error: false,
        getCountryPriceList: {
          selectedCountry: 'us'
        },
        fetched: true
      }
    },

    mounted () {
      this.changeCountry()
    },

    methods: {
      changeCountry () {
        this.error = false
        this.fetched = false
        this.sendAmeliaSmsApiRequest('getCountryPriceList', this.onGetCountryPriceListSuccess, this.onGetCountryPriceListError)
      },

      onGetCountryPriceListSuccess (data) {
        this.carriers = data['carriers']
        this.fetched = true
      },

      onGetCountryPriceListError () {
        this.notify(this.$root.labels.error, this.$root.labels.pricing_error, 'error')
        this.error = true
        this.fetched = true
      }
    }
  }
</script>
