<template>
  <div v-if="$root.isLite">
    <!-- Dialog Lite -->
    <transition name="slide">
      <el-dialog class="am-side-dialog" :class="{'am-dialog-employee-lite': isEmployeeDialog}"
                 :visible.sync="$root.dialogLite" :show-close="false" v-if="$root.dialogLite">
        <div class="am-dialog-scrollable am-lite-dialog-no-margin">
          <!-- Dialog Header -->
          <div class="am-dialog-header">
            <el-row>
              <el-col :span="20">
                <h2> Upgrade </h2>
              </el-col>
              <el-col :span="4" class="align-right">
                <el-button @click="$root.dialogLite = false" class="am-dialog-close" size="small"
                           icon="el-icon-close"></el-button>
              </el-col>
            </el-row>
          </div>

          <div class="am-lite am-lite-dialog">
            <img :src="$root.getUrl + 'public/img/calendar-illustration-min.png'" class="am-lite-dialog-image">

            <p class="am-lite-dialog-title">Oops, this is a full version feature!</p>
            <p class="am-lite-dialog-description">Upgrade today to make the appointment booking process even easier and
              more flexible:</p>

            <a href="https://wpamelia.com/pricing/" target="_blank"><el-button type="primary">Upgrade</el-button></a>

            <ul class="am-lite-features">
              <li>
                <i class="am-lite-check"></i><span>   Unlimited staff members</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Unlimited locations</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Multiple shortcodes</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Service extras</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Package of Services</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Recurring Appointments</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Discount coupons</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Premium support</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Web Hooks</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   PayPal and Stripe integration</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Google Calendar sync</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Outlook Calendar sync</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   WooCommerce integration</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Zoom integration</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Customers and Employee panel</span>
              </li>
              <li>
                <i class="am-lite-check"></i><span>   Facebook Pixel and Google Analytics integration</span>
              </li>
              <li>
                <span>   <br/>and many more...</span>
              </li>
            </ul>

            <span>   Pre-purchase question?
              <a href="https://tmsplugins.ticksy.com/" target="_blank">Contact us!</a>
            </span>
          </div>
        </div>
      </el-dialog>
    </transition>
  </div>
</template>

<script>
  export default {

    props: {
      isEmployeeDialog: false
    },

    data () {
      return {}
    },

    mounted () {
      let eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent'

      let eventer = window[eventMethod]

      let messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message'

      // Listen to message from child IFrame window
      eventer(messageEvent, function (e) {
        if (e.data === 'tmsStoreCloseIFrame') {
          document.getElementById('tms-store-iframe').remove()
        }
      }, false)
    },

    methods: {
      upgrade: function () {
        let iframe = document.createElement('iframe')
        iframe.id = 'tms-store-iframe'
        iframe.setAttribute(
          'style',
          'z-index: 9999999999; display: block; background-color: transparent; border: 0px none transparent; overflow-x: hidden; overflow-y: auto; visibility: visible; margin: 0px; padding: 0px; -webkit-tap-highlight-color: transparent; position: fixed; left: 0px; top: 0px; width: 100%; height: 100%;')

        iframe.src = wpAmeliaPluginStoreURL.substring(0, wpAmeliaPluginStoreURL.length - 4) + 'static/pages/ameliabooking.html'
        document.body.appendChild(iframe)
      }
    }
  }
</script>
