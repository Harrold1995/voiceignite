<template>
  <div>
    <div class="am-dialog-footer">
      <div class="am-dialog-footer-actions">

        <!-- Dialog Delete Confirmation -->
        <transition name="slide-vertical">
          <div class="am-dialog-confirmation" v-show="showDeleteConfirmation">
            <h3 v-show="allowedDelete">{{ message.confirm.remove }}</h3>
            <el-alert
                v-if="action.haveRemoveEffect && deleteEffectMessage"
                title=""
                type="warning"
                :description="deleteEffectMessage"
                show-icon
                :closable="false"
            >
            </el-alert>
            <div class="align-left" v-if="hasApplyGloballyDeletion">
              <el-button size="small" @click="deleteEntity(false)" type="primary">
                {{ getConfirmDeleteButtonText().no }}
              </el-button>
              <el-button size="small" @click="deleteEntity(true)" type="primary">
                {{ getConfirmDeleteButtonText().yes }}
              </el-button>
            </div>
            <div class="align-left" v-else>
              <el-button size="small" v-if="allowedDelete" @click="showDeleteConfirmation = !showDeleteConfirmation">
                {{ $root.labels.cancel }}
              </el-button>
              <el-button size="small" v-if="allowedDelete" @click="deleteEntity(false)" type="primary">
                {{ $root.labels.delete }}
              </el-button>
              <el-button size="small" v-if="!allowedDelete" @click="showDeleteConfirmation = !showDeleteConfirmation">
                {{ $root.labels.close }}
              </el-button>
            </div>
          </div>
        </transition>

        <!-- Dialog Visibility Confirmation -->
        <transition name="slide-vertical">
          <div class="am-dialog-confirmation" v-if="status" v-show="showVisibilityConfirmation">
            <h3 v-if="isStatusOn()">{{ message.confirm.hide }}</h3>
            <h3 v-else-if="isStatusOff()">{{ message.confirm.show }}</h3>
            <div class="align-left" v-if="hasApplyGloballyVisibility">
              <el-button size="small" v-if="isStatusOn()" @click="hideEntity(false)" type="primary">
                {{ getConfirmStatusButtonText().no }}
              </el-button>
              <el-button size="small" v-if="isStatusOn()" @click="hideEntity(true)" type="primary">
                {{ getConfirmStatusButtonText().yes }}
              </el-button>
              <el-button size="small" v-if="isStatusOff()" @click="showEntity(false)" type="primary">
                {{ getConfirmStatusButtonText().no }}
              </el-button>
              <el-button size="small" v-if="isStatusOff()" @click="showEntity(true)" type="primary">
                {{ getConfirmStatusButtonText().yes }}
              </el-button>
            </div>
            <div class="align-left" v-else>
              <el-button size="small" @click="showVisibilityConfirmation = !showVisibilityConfirmation">
                {{ $root.labels.cancel }}
              </el-button>
              <el-button size="small" v-if="isStatusOn()" @click="hideEntity(false)" type="primary">
                {{ getConfirmStatusButtonText().yes }}
              </el-button>
              <el-button size="small" v-if="isStatusOff()" @click="showEntity(false)" type="primary">
                {{ getConfirmStatusButtonText().yes }}
              </el-button>
            </div>
          </div>
        </transition>

        <!-- Dialog Duplicate Confirmation -->
        <transition name="slide-vertical">
          <div class="am-dialog-confirmation" v-show="showDuplicateConfirmation">
            <h3>{{ message.confirm.duplicate }}</h3>
            <div class="align-left">
              <el-button size="small" @click="showDuplicateConfirmation = !showDuplicateConfirmation">
                {{ $root.labels.cancel }}
              </el-button>
              <el-button size="small" @click="duplicateEntity" type="primary">
                {{ $root.labels.duplicate }}
              </el-button>
            </div>
          </div>
        </transition>

        <!-- Dialog Save Confirm -->
        <transition name="slide-vertical">
          <div class="am-dialog-confirmation" v-show="showSaveConfirmation">
            <h3 v-if="buttonText">{{ message.confirm.save }}</h3>
            <div class="align-left" v-if="buttonText">
              <el-button type="primary" size="small" @click="onSubmit(false)">
                {{ getConfirmSaveButtonText().no }}
              </el-button>
              <el-button type="primary" size="small" @click="onSubmit(true)">
                {{ getConfirmSaveButtonText().yes }}
              </el-button>
            </div>
            <el-alert
                v-if="action.haveSaveWarning"
                title=""
                type="warning"
                :description="message.confirm.save"
                show-icon
                :closable="false"
                style="word-break: break-word;"
            >
            </el-alert>
          </div>
        </transition>

        <!-- Dialog Buttons -->
        <el-row v-if="!isNew">
          <el-col :sm="16" class="align-left">
            <el-button
                v-if="action.haveDuplicate"
                :class="{'am-button-icon': hasIcons, 'am-dialog-create': !hasIcons}"
                :type="getButtonType('duplicate')"
                @click="handleDuplicateConfirmation">
              <img v-if="hasIcons" class="svg-amelia" :alt="$root.labels.duplicate" :src="$root.getUrl+'public/img/copy.svg'"/>
              <span v-else>{{getActionDuplicateButtonText()}}</span>
            </el-button>
            <el-button
                v-if="action.haveStatus"
                :class="{'am-button-icon': hasIcons, 'am-dialog-create': !hasIcons}"
                :type="getButtonType('status')"
                @click="handleVisibilityConfirmation">
              <img v-if="hasIcons" class="svg-amelia" :alt="$root.labels.hide"
                   :src="$root.getUrl+ (isStatusOff() ? 'public/img/unhide.svg' : 'public/img/hide.svg')"/>
              <span v-else>{{getActionStatusButtonText()}}</span>
            </el-button>
            <el-button
                v-if="action.haveRemove"
                :class="{'am-button-icon': hasIcons, 'am-dialog-create': !hasIcons}"
                :type="getButtonType('remove')"
                @click="handleDeleteConfirmation">
              <img v-if="hasIcons" class="svg-amelia" :alt="$root.labels.delete"
                   :src="$root.getUrl+'public/img/delete.svg'"/>
              <span v-else>{{getActionRemoveButtonText()}}</span>
            </el-button>
          </el-col>
          <el-col
              :sm="(action.haveRemove === false && action.haveStatus === false && action.haveDuplicate === false) ? 24 : 8"
              class="align-right">
            <el-button
                v-if="action.haveAdd && action.haveEdit"
                type="primary" @click="handleSaveClick" class="am-dialog-create"
                :loading="loadSaveButton">
              {{ $root.labels.save }}
            </el-button>
          </el-col>
        </el-row>
        <el-row v-else>
          <el-col :sm="24" class="align-right">
            <el-button type="" @click="closeDialog" class="">
              {{ $root.labels.cancel }}
            </el-button>
            <el-button
                v-if="action.haveAdd && action.haveEdit"
                type="primary" @click="handleSaveClick" class="am-dialog-create"
                :loading="loadSaveButton">
              {{ $root.labels.save }}
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- Dialog Loader -->
    <div class="am-dialog-loader" v-show="dialogLoading">
      <div class="am-dialog-loader-content">
        <img :src="$root.getUrl+'public/img/spinner.svg'" class="">
        <p>{{ $root.labels.loader_message }}</p>
      </div>
    </div>

  </div>
</template>

<script>
  import Form from 'form-object'
  import notifyMixin from '../../../js/backend/mixins/notifyMixin'
  import dateMixin from '../../../js/common/mixins/dateMixin'
  import cabinetMixin from '../../../js/frontend/mixins/cabinetMixin'
  import stashMixin from '../../../js/backend/mixins/stashMixin'

  export default {

    mixins: [notifyMixin, dateMixin, cabinetMixin, stashMixin],

    props: {
      formName: '',
      urlName: null,
      isNew: null,
      entity: null,
      getParsedEntity: null,
      updateStash: false,
      haveSaveConfirmation: null,
      hasApplyGloballyVisibility: false,
      hasApplyGloballyDeletion: false,
      loadSaveButton: false,
      calendarConflict: {enable: false},
      getCalendarEvents: null,

      hasIcons: true,

      status: null,

      buttonType: {
        status: 'primary',
        remove: 'danger'
      },

      action: {
        haveAdd: false,
        haveEdit: false,
        haveStatus: false,
        haveRemove: false,
        haveRemoveEffect: false,
        ignoreDeleteEffect: false,
        haveDuplicate: false,
        haveSaveWarning: false
      },

      message: {
        success: {
          save: null,
          remove: null,
          show: null,
          hide: null
        },
        confirm: {
          remove: null,
          show: null,
          hide: null,
          duplicate: null,
          save: null
        }
      },

      buttonText: null
    },

    data () {
      return {
        form: new Form(),

        allowedDelete: true,

        showDeleteConfirmation: false,
        showVisibilityConfirmation: false,
        showDuplicateConfirmation: false,
        showSaveConfirmation: false,
        showAddHoursDialog: false,
        confirmCalendarConflict: false,

        deleteEffectMessage: null,

        dialogLoading: false
      }
    },

    methods: {
      getButtonType (actionType) {
        switch (actionType) {
          case ('status'):
            return this.hasIcons ? null : this.buttonType.status

          case ('remove'):
            return this.hasIcons ? null : this.buttonType.remove

          case ('duplicate'):
            return this.hasIcons ? null : this.buttonType.duplicate
        }
      },

      closeDialog () {
        this.$parent.$emit('closeDialog')
      },

      onSubmit (applyGlobally) {
        let $this = this.$root
        this.$parent.$refs[this.formName].validate((valid, errors) => {
          if (valid) {
            if (this.calendarConflict && this.calendarConflict.enabled) {
              this.handleSaveConfirmation()
              if (applyGlobally) {
                this.$emit('confirmCalendarConflict')
                this.confirmCalendarConflict = true
                this.handleSaveClick(applyGlobally)
              }
            } else {
              this.dialogLoading = true
              if (this.isNew) {
                this.addEntity(applyGlobally)
              } else {
                this.editEntity(applyGlobally)
              }
            }
          } else {
            // For Appointment dialog, change tab to "Custom Fields" if validation error only there
            if (this.formName === 'appointment') {
              this.handleAppointmentDialogTabChange(errors)
            }

            this.$emit('validationFailCallback')
            return false
          }

          this.$root = $this
        })
      },

      onSuccess (title, message, response) {
        this.$parent.$emit('saveCallback', response)
        setTimeout(() => {
          this.dialogLoading = false
          this.$parent.$emit('closeDialog')
        }, 300)
        this.notify(title, message, 'success')
      },

      onError (title, responseData) {
        this.dialogLoading = false
        this.$emit('errorCallback', responseData)
      },

      addEntity (applyGlobally) {
        let config = null

        if (this.$store !== undefined && this.$store.state.cabinet !== undefined && this.$store.state.cabinet.cabinetType === 'provider') {
          config = Object.assign(this.getAuthorizationHeaderObject(), {params: {source: 'cabinet-' + this.$store.state.cabinet.cabinetType}})
        }

        this.$http.post(this.$root.getAjaxUrl + '/' + this.urlName, this.getParsedEntity(applyGlobally), config)
          .then(response => {
            this.onSuccess(this.$root.labels.success, this.message.success.save, response.data.data)

            if (this.updateStash) {
              this.updateStashEntities({})
            }
          })
          .catch(error => {
            if (error.response) {
              this.onError('', error.response.data.data)
            }
          })
      },

      editEntity (applyGlobally) {
        let config = null

        if (this.$store !== undefined && this.$store.state.cabinet !== undefined && this.$store.state.cabinet.cabinetType === 'provider') {
          config = Object.assign(this.getAuthorizationHeaderObject(), {params: {source: 'cabinet-' + this.$store.state.cabinet.cabinetType}})
        }

        this.$http.post(
          this.$root.getAjaxUrl + '/' + this.urlName + '/' + this.entity.id,
          this.getParsedEntity(applyGlobally),
          config
        ).then(response => {
          this.onSuccess(this.$root.labels.success, this.message.success.save, response.data.data)

          if (this.updateStash) {
            this.updateStashEntities({})
          }
        }).catch(error => {
          if (error.response) {
            this.onError('', error.response.data.data)
          }
        })
      },

      deleteEntity (applyGlobally) {
        this.dialogLoading = true
        this.form.post(this.$root.getAjaxUrl + '/' + this.urlName + '/delete/' + this.entity.id, {
          'status': this.status.on,
          'applyGlobally': applyGlobally
        })
          .then(response => {
            this.onSuccess(this.$root.labels.success, this.message.success.remove, response.data.data)

            if (this.updateStash) {
              this.updateStashEntities({})
            }
          })
          .catch(error => {
            if (error.response) {
              this.onError('', error.response.data.data.message)
            }
          })
      },

      showEntity (applyGlobally) {
        this.dialogLoading = true
        this.form.post(this.$root.getAjaxUrl + '/' + this.urlName + '/status/' + this.entity.id, {
          'status': this.status.on,
          'applyGlobally': applyGlobally
        })
          .then(response => {
            this.onSuccess(this.$root.labels.success, this.message.success.show, null)

            if (this.updateStash) {
              this.updateStashEntities({})
            }
          })
          .catch(error => {
            if (error.response) {
              this.onError('', error.response.data.data.message)
            }
          })
      },

      hideEntity (applyGlobally) {
        this.dialogLoading = true
        this.form.post(this.$root.getAjaxUrl + '/' + this.urlName + '/status/' + this.entity.id, {
          'status': this.status.off,
          'applyGlobally': applyGlobally
        }).then(() => {
          this.onSuccess(this.$root.labels.success, this.message.success.hide, null)

          if (this.updateStash) {
            this.updateStashEntities({})
          }
        }).catch(error => {
          if (error.response) {
            this.onError('', error.response.data.data.message)
          }
        })
      },

      duplicateEntity () {
        this.dialogLoading = true
        this.$parent.$emit('closeDialog', true)
        this.$parent.$emit('duplicateCallback', this.entity)
        setTimeout(() => {
          this.showDuplicateConfirmation = false
          this.dialogLoading = false
        }, 600)
      },

      handleSaveConfirmation () {
        this.showSaveConfirmation = !this.showSaveConfirmation
        this.showVisibilityConfirmation = false
        this.showDeleteConfirmation = false
        this.showDuplicateConfirmation = false
      },

      handleDuplicateConfirmation () {
        this.showDuplicateConfirmation = !this.showDuplicateConfirmation
        this.showSaveConfirmation = false
        this.showDeleteConfirmation = false
        this.showVisibilityConfirmation = false
      },

      handleVisibilityConfirmation () {
        this.showVisibilityConfirmation = !this.showVisibilityConfirmation
        this.showSaveConfirmation = false
        this.showDeleteConfirmation = false
        this.showDuplicateConfirmation = false
      },

      handleDeleteConfirmation () {
        this.showVisibilityConfirmation = false
        this.showDuplicateConfirmation = false
        this.showSaveConfirmation = false

        if (this.action.haveRemoveEffect) {
          if (this.showDeleteConfirmation === false) {
            this.$http.get(this.$root.getAjaxUrl + '/' + this.urlName + '/effect/' + this.entity.id)
              .then(response => {
                this.allowedDelete = response.data.data.valid || this.ignoreDeleteEffect
                this.deleteEffectMessage = response.data.data.message
                this.showDeleteConfirmation = !this.showDeleteConfirmation
              })
              .catch(e => {
                this.showDeleteConfirmation = !this.showDeleteConfirmation
                this.deleteEffectMessage = ''
              })
          }
        } else {
          this.showDeleteConfirmation = !this.showDeleteConfirmation
        }
      },

      handleSaveClick () {
        if (this.getCalendarEvents && !this.confirmCalendarConflict) {
          this.getCalendarEvents().then(() => {
            if (this.haveSaveConfirmation && this.haveSaveConfirmation()) {
              this.handleSaveConfirmation()
            } else {
              this.onSubmit(false)
            }
          })
        } else {
          if (this.haveSaveConfirmation && this.haveSaveConfirmation()) {
            this.handleSaveConfirmation()
          } else {
            this.onSubmit(false)
          }
        }
      },

      getConfirmSaveButtonText () {
        return this.buttonText !== null && this.buttonText.confirm && this.buttonText.confirm.save ? {
          yes: this.buttonText.confirm.save.yes,
          no: this.buttonText.confirm.save.no
        } : {
          yes: this.$root.labels.yes,
          no: this.$root.labels.no
        }
      },

      getConfirmDeleteButtonText () {
        return this.buttonText !== null && this.buttonText.confirm && this.buttonText.confirm.remove ? {
          yes: this.buttonText.confirm.remove.yes,
          no: this.buttonText.confirm.remove.no
        } : {
          yes: this.$root.labels.yes,
          no: this.$root.labels.no
        }
      },

      getConfirmStatusButtonText () {
        return this.buttonText !== null && this.buttonText.confirm && this.buttonText.confirm.status ? {
          yes: this.buttonText.confirm.status.yes,
          no: this.buttonText.confirm.status.no
        } : {
          yes: this.$root.labels.yes,
          no: this.$root.labels.no
        }
      },

      getActionStatusButtonText () {
        return this.buttonText !== null && this.buttonText.action ? this.buttonText.action.status : ''
      },

      getActionRemoveButtonText () {
        return this.buttonText !== null && this.buttonText.action ? this.buttonText.action.remove : ''
      },

      getActionDuplicateButtonText () {
        return this.buttonText !== null && this.buttonText.action ? this.buttonText.action.duplicate : ''
      },

      handleAppointmentDialogTabChange (errors) {
        let errorKeys = Object.keys(errors)
        let numberOfBookingErrors = 0
        for (let i = 0; i < errorKeys.length; i++) {
          numberOfBookingErrors = errorKeys[i].startsWith('bookings.') ? numberOfBookingErrors + 1 : numberOfBookingErrors
        }

        if (numberOfBookingErrors === errorKeys.length) {
          this.$emit('validationBookingsFailCallback')
        }
      },

      isStatusOn () {
        return this.entity.status === this.status.on
      },

      isStatusOff () {
        return this.entity.status === this.status.off
      }
    },

    computed: {},

    components: {}

  }
</script>
