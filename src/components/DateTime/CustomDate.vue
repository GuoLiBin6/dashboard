<template>
  <a-popconfirm
    ref="customDate"
    class="custom-date-popconfirm"
    placement="bottomRight"
    overlayClassName="custom-date-time"
    :open="visible"
    @confirm="submit"
    @cancel="cancel"
    @openChange="onPopOpenChange">
    <template v-slot:icon><i /></template>
    <template v-slot:title class="pl-0">
      <div @click="hiddenMonthSelectVisble">
        <a-form-model hideRequiredMark v-if="isAdvancedView" ref="ruleForm" :model="formData" :rules="rules" v-bind="layout">
          <a-form-model-item :label="$t('common.date_range')" prop="date_range">
            <div class="custom-date-time__picker">
              <date-range-picker
                ref="dateSelect"
                v-model="formData.date_range"
                :panelVisible="visible"
                :disabledDate="disabledDate"
                @calendarChange="onCalendarChange"
                @openChange="onPickerOpenChange" />
            </div>
          </a-form-model-item>
        </a-form-model>
        <a-form-model hideRequiredMark v-else ref="ruleForm" :model="formData" :rules="rules" v-bind="layout">
          <a-form-model-item :label="$t('common.date_range')" prop="month_range">
            <month-range-picker ref="monthSelect" v-model="formData.month_range" :panelVisible="visible" />
          </a-form-model-item>
        </a-form-model>
        <a-button
          v-if="!isHideCustomAdvanced"
          type="link"
          class="custom-date-time__switch position-absolute"
          style="bottom: -28px;"
          @click="toggleView">
          {{ isAdvancedView ? $t('common.date_time.quick') : $t('common.date_time.advanced') }}
        </a-button>
      </div>
    </template>
    <a-radio-button value="custom">{{ $t('common.date_time.custom') }}{{ customTimeLabel }}</a-radio-button>
  </a-popconfirm>
</template>

<script>
import moment from 'moment'
import dayjs from '@/utils/dayjs'
import DateRangePicker from '@/components/DateRangePicker'
import MonthRangePicker from '@/components/MonthRangePicker'

function toDayjs (val) {
  if (val == null || val === '') return null
  if (dayjs.isDayjs(val)) return val
  if (val && typeof val.toDate === 'function') return dayjs(val.toDate())
  const d = dayjs(val)
  return d.isValid() ? d : null
}

function toMoment (val) {
  if (val == null || val === '') return null
  if (moment.isMoment(val)) return val
  if (dayjs.isDayjs(val)) return moment(val.toDate())
  if (val && typeof val.toDate === 'function') return moment(val.toDate())
  return moment(val)
}

export default {
  name: 'CustomDate',
  components: {
    DateRangePicker,
    MonthRangePicker,
  },
  props: {
    customDate: {
      type: Object,
      default: () => ({
        start: moment(),
        end: moment(),
      }),
    },
    customTimeLabel: String,
    canSelectTodayAfter: {
      type: Boolean,
      default: true,
    },
    showFormat: String,
    isHideCustomAdvanced: Boolean,
  },
  data () {
    const start = this.customDate && this.customDate.start
    const end = this.customDate && this.customDate.end
    return {
      formData: {
        month_range: start ? [moment(start), moment(end)] : [null, null],
        date_range: [toDayjs(start) || dayjs(), toDayjs(end) || dayjs()],
      },
      monthChangeIndex: 0,
      isAdvancedView: false,
      confirmView: true,
      visible: false,
      monthSelectVisble: false,
      pickerOpen: false,
      layout: {
        labelCol: { span: 5 },
        wrapperCol: { span: 19 },
      },
      rules: {
        date_range: [
          { required: true, validator: this.dateRangeValidate },
        ],
        start_month: [
          { required: true, validator: this.monthStartValidate },
        ],
        end_month: [
          { required: true, validator: this.monthEndValidate },
        ],
      },
    }
  },
  watch: {
    isAdvancedView (val) {
      if (!val && !this.visible) {
        this.monthChangeIndex = 0
      }
      if (val) {
        this.syncDateRangeFromSource()
      }
    },
    visible (val) {
      if (!val && !this.isAdvancedView) {
        this.monthChangeIndex = 0
      }
      if (!val) {
        this.monthSelectVisble = false
        this.pickerOpen = false
      }
      if (val) {
        this.$nextTick(() => {
          const that = this
          const tags = document.getElementsByClassName('ant-popover-inner-content')
          for (let i = 0; i < tags.length; i++) {
            tags[i].addEventListener('click', function () {
              const month = that.$refs.monthSelect
              if (month && typeof month.hiddenPanel === 'function') month.hiddenPanel()
            })
          }
        })
      }
    },
  },
  methods: {
    syncDateRangeFromSource () {
      const monthStart = this.formData.month_range && this.formData.month_range[0]
      const monthEnd = this.formData.month_range && this.formData.month_range[1]
      if (monthStart && monthEnd) {
        this.formData.date_range = [toDayjs(monthStart), toDayjs(monthEnd)]
        return
      }
      const start = this.customDate && this.customDate.start
      const end = this.customDate && this.customDate.end
      this.formData.date_range = [toDayjs(start) || dayjs(), toDayjs(end) || dayjs()]
    },
    onCalendarChange (dates) {
      if (!dates) {
        this.formData.date_range = [null, null]
        return
      }
      const next = [dates[0] ? toDayjs(dates[0]) : null, dates[1] ? toDayjs(dates[1]) : null]
      this.formData.date_range = next
    },
    onPickerOpenChange (open) {
      this.pickerOpen = !!open
    },
    isPickerDropdownOpen () {
      return !!(this.$refs.dateSelect && this.$refs.dateSelect.visible)
    },
    onPopOpenChange (open) {
      if (!open && (this.pickerOpen || this.isPickerDropdownOpen())) {
        return
      }
      this.visible = open
    },
    hiddenMonthSelectVisble () {
      const month = this.$refs.monthSelect
      if (month && typeof month.hiddenPanel === 'function') month.hiddenPanel()
      const date = this.$refs.dateSelect
      if (date && typeof date.hiddenPanel === 'function') date.hiddenPanel()
    },
    disabledDate (current) {
      if (!current || this.canSelectTodayAfter) return false
      return current > dayjs().endOf('day')
    },
    dateRangeValidate (rule, value, callback) {
      if (value && value[0] && value[1]) {
        if (!this.canSelectTodayAfter && toDayjs(value[1]) > dayjs().endOf('day')) {
          callback(new Error(this.$t('common.select_time_little_current')))
          return
        }
        callback()
        return
      }
      callback(new Error(this.$t('common.tips.select', [this.$t('common.date_range')])))
    },
    monthStartValidate (rule, value, callback) {
      if (this.formData.month_range[0]) {
        callback()
        return
      }
      callback(new Error(this.$t('common.tips.select', [this.$t('common.date_range')])))
    },
    monthEndValidate (rule, value, callback) {
      if (this.formData.month_range[1]) {
        callback()
        return
      }
      callback(new Error(this.$t('common.tips.select', [this.$t('common.date_range')])))
    },
    toggleView () {
      this.isAdvancedView = !this.isAdvancedView
    },
    cancel () {
      this.pickerOpen = false
      this.visible = false
      setTimeout(() => {
        this.isAdvancedView = this.confirmView
      }, 300)
    },
    getCustomTime () {
      if (this.isAdvancedView) {
        return {
          start: toMoment(this.formData.date_range[0]),
          end: toMoment(this.formData.date_range[1]),
        }
      }
      return {
        start: this.$moment(this.formData.month_range[0].startOf('month')),
        end: this.$moment(this.formData.month_range[1].endOf('month')),
      }
    },
    async submit () {
      try {
        const valid = this.isAdvancedView ? await this.$refs.ruleForm.validate() : true
        const customDate = this.getCustomTime()
        if (valid) {
          this.$emit('update:time', 'custom')
          this.$emit('update:customDate', customDate)
          this.$emit('change', customDate)
          this.pickerOpen = false
          this.visible = false
        } else {
          this.visible = true
        }
        this.confirmView = this.isAdvancedView
      } catch (error) {
        this.visible = true
        throw error
      }
    },
  },
}
</script>

<style lang="less">
.custom-date-time .ant-popover-inner-content {
  min-width: 420px;
  overflow: visible;
}
.custom-date-time .ant-picker-dropdown {
  z-index: 1100;
}
.custom-date-time .ant-form-item {
  margin-bottom: 12px;
}
.custom-date-time .ant-form-item-control,
.custom-date-time .ant-form-item-control-input,
.custom-date-time .ant-form-item-control-input-content {
  min-width: 0;
}
.custom-date-time__picker {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.custom-date-time .oc-date-range,
.custom-date-time .oc-month-range,
.custom-date-time .oc-date-range__input,
.custom-date-time .oc-month-range__input,
.custom-date-time .ant-picker {
  width: 100% !important;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.custom-date-time .custom-date-time__switch,
.custom-date-time .custom-date-time__switch.ant-btn-link {
  color: var(--ant-color-primary, #1890ff);
}
.custom-date-time .custom-date-time__switch.ant-btn-link:hover,
.custom-date-time .custom-date-time__switch.ant-btn-link:focus {
  color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 80%, #fff);
}
.custom-date-time .ant-btn-primary {
  background-color: var(--ant-color-primary, #1890ff);
  border-color: var(--ant-color-primary, #1890ff);
}
.custom-date-time .ant-btn-primary:hover,
.custom-date-time .ant-btn-primary:focus {
  background-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 80%, #fff) !important;
  border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 80%, #fff) !important;
}
/* 保持与 radio-group 同行，避免单独换行 */
.custom-date-popconfirm {
  display: inline-flex !important;
  vertical-align: top;
}
</style>
