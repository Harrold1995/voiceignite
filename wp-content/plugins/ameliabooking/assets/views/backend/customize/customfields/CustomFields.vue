<template>
  <div>

    <!-- Custom Fields -->
    <div class="am-custom-fields" id="qweqwe">

      <!-- Spinner -->
      <div class="am-spinner am-section" v-show="!fetched || !options.fetched">
        <img :src="$root.getUrl + 'public/img/spinner.svg'"/>
      </div>

      <!-- Empty State -->
      <div class="am-empty-state am-section" v-if="fetched && options.fetched && customFields.length === 0">
        <img :src="$root.getUrl + 'public/img/emptystate.svg'">
        <h2>{{ $root.labels.no_custom_fields_yet }}</h2>
        <p>{{ $root.labels.click_add_custom_field }}</p>
      </div>

      <!-- Custom Fields List -->
      <div class="am-custom-fields-list" v-show="fetched && options.fetched && customFields.length > 0">

        <!-- Checkbox send all custom fields -->
        <el-checkbox
          v-model="separateCustomFields"
          style="padding-bottom: 20px"
          @change="saveSendAllCustomFields()"
        >
          {{ $root.labels.send_custom_fields_separately }}
          <el-tooltip placement="top">
            <div slot="content" v-html="$root.labels.send_custom_fields_tooltip"></div>
            <i class="el-icon-question am-tooltip-icon"></i>
          </el-tooltip>
        </el-checkbox>

        <!-- Custom Field Component -->
        <draggable v-model="customFields" :options="draggableOptions" @end="dropCustomField">
          <custom-field
            v-for="customField in customFields"
            :key="customField.id"
            :customField="customField"
            :events="options.entities.events"
            :categories="options.entities.categories"
            :services="options.entities.services"
            :passed-used-languages="options.settings.general.usedLanguages"
            :languages-data="languagesData"
            @deleteCustomField="deleteCustomField"
            @updateCustomField="updateCustomField"
            @usedLanguagesUpdated="updateUsedLanguages"
          >
          </custom-field>
        </draggable>

      </div>

    </div>

    <!-- Dialog Custom Fields -->
    <transition name="slide">
      <el-dialog
        :close-on-click-modal="false"
        class="am-side-dialog am-dialog-custom-fields"
        :visible.sync="showDialog"
        :show-close="false" v-if="showDialog"
      >
        <dialog-custom-fields
          @closeDialogCustomFields="closeDialogCustomFields"
          @addCustomField="addCustomField"
        >
        </dialog-custom-fields>
      </el-dialog>
    </transition>

    <!-- Button New -->
    <div id="am-button-new" class="am-button-new">

      <!-- Popover -->
      <el-popover
        ref="popover"
        placement="top"
        width="160"
        v-model="popover"
        visible-arrow="false"
        popper-class="am-button-popover"
      >
        <div class="am-overlay" @click="popover = false; buttonNewItems = !buttonNewItems">
          <el-popover :disabled="!$root.isLite" ref="customFieldsPop" v-bind="$root.popLiteProps"><PopLite/></el-popover>
          <div class="am-button-new-items-custom-fields" v-popover:customFieldsPop>
            <transition name="el-zoom-in-bottom">
              <div v-show="buttonNewItems">
                <el-button
                    v-for="(type, index) in types"
                    :key="index" @click="addCustomField(type)"
                    :disabled="$root.isLite"
                >
                  {{ $root.labels[type] }}
                </el-button>
              </div>
            </transition>
          </div>
        </div>
      </el-popover>

      <!-- Button -->
      <el-button
        id="am-plus-symbol"
        v-popover:popover
        type="primary"
        icon="el-icon-plus"
        @click="buttonNewItems = !buttonNewItems"
      >
      </el-button>

    </div>

  </div>
</template>

<script>
  import CustomField from './CustomField'
  import DialogCustomFields from './DialogCustomFields.vue'
  import Draggable from 'vuedraggable'
  import notifyMixin from '../../../../js/backend/mixins/notifyMixin'
  import imageMixin from '../../../../js/common/mixins/imageMixin'
  import entitiesMixin from '../../../../js/common/mixins/entitiesMixin'
  import stashMixin from '../../../../js/backend/mixins/stashMixin'

  export default {
    mixins: [notifyMixin, imageMixin, entitiesMixin, stashMixin],

    props: {
      dialogCustomFields: {
        default: false,
        type: Boolean
      }
    },

    data () {
      return {
        separateCustomFields: false,
        buttonNewItems: false,
        customFields: [],
        draggableOptions: {
          handle: '.am-drag-handle',
          animation: 150
        },
        fetched: false,
        options: {
          entities: {
            events: [],
            categories: [],
            services: []
          },
          settings: {
            general: {
              usedLanguages: []
            }
          },
          fetched: false
        },
        languagesData: [],
        popover: false,
        types: ['text', 'text-area', 'content', 'select', 'checkbox', 'radio', 'file', 'datepicker']
      }
    },

    mounted: function () {
      this.fetched = true
      this.options.fetched = true
    },

    methods: {
      getCustomFields: function () {},

      getEntities: function () {},

      dropCustomField: function () {},

      deleteCustomField: function () {},

      updateCustomField: function () {},

      closeDialogCustomFields () {
        this.$emit('closeDialogCustomFields')
      },

      addCustomField: function () {},

      updateCustomFieldsPositions: function () {},

      saveSendAllCustomFields () {}
    },

    computed: {
      showDialog: {
        get () {
          return this.dialogCustomFields === true
        },
        set () {
          this.$emit('closeDialogCustomFields')
        }
      }
    },

    components: {
      CustomField,
      DialogCustomFields,
      Draggable
    }
  }
</script>
