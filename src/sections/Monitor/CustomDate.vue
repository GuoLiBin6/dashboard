<template>
  <a-popover
    placement="bottomLeft"
    overlayClassName="custom-date-time"
    trigger="click"
    :open="visible"
    @openChange="handlePopOpenChange">
    <template #content>
      <div class="monitor-custom-date">
        <a-alert v-if="diffHours < 1" class="mb-2" :message="$t('common_587')" type="error" show-icon />
        <div class="monitor-custom-date__row">
          <div class="monitor-custom-date__label">{{ $t('common.text00119') }}</div>
          <oc-date-time-picker
            v-model:value="startValue"
            layout="combined"
            class="w-100"
            format="YYYY-MM-DD HH:mm"
            :allow-clear="false"
            :disabled-date="disabledStartDate"
            :disabled-time="disabledDateTime"
            :date-placeholder="$t('common.text00119')"
            :get-popup-container="getPopupContainer"
            :popup-style="popupStyle"
            @openChange="onPickerOpenChange" />
        </div>
        <div class="monitor-custom-date__row">
          <div class="monitor-custom-date__label">{{ $t('common.text00120') }}</div>
          <oc-date-time-picker
            v-model:value="endValue"
            layout="combined"
            class="w-100"
            format="YYYY-MM-DD HH:mm"
            :allow-clear="false"
            :disabled-date="disabledEndDate"
            :disabled-time="disabledDateTime"
            :date-placeholder="$t('common.text00120')"
            :get-popup-container="getPopupContainer"
            :popup-style="popupStyle"
            @openChange="onPickerOpenChange" />
        </div>
        <div class="monitor-custom-date__footer">
          <a-button size="small" @click="cancel">{{ $t('dialog.cancel') }}</a-button>
          <a-button size="small" type="primary" class="ml-2" @click="submit">{{ $t('dialog.ok') }}</a-button>
        </div>
      </div>
    </template>
    <a-radio-button value="custom">{{ $t('common.text00121') }}{{ customTimeText }}</a-radio-button>
  </a-popover>
</template>

<script>
import * as R from 'ramda'
import dayjs from 'dayjs'
import moment from 'moment'
import OcDateTimePicker from '@/components/OcDateTimePicker'

function toDayjs (val) {
  if (val == null || val === '') return null
  if (dayjs.isDayjs(val)) return val
  if (val && typeof val.toDate === 'function') return dayjs(val.toDate())
  const d = dayjs(val)
  return d.isValid() ? d : null
}

export default {
  name: 'MonitorCustomDate',
  compatConfig: { MODE: 3 },
  components: { OcDateTimePicker },
  props: {
    startTime: {
      type: Object,
      required: false,
      default: () => null,
    },
    endTime: {
      type: Object,
      default: () => moment(),
    },
    customTime: {
      type: Object,
      validator: val => val.from,
    },
    allowFutureTime: {
      type: Boolean,
      default: false,
    },
    showCustomTimeText: {
      type: Boolean,
      default: false,
    },
    customTimeUseTimeStamp: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    const start = toDayjs(this.startTime)
    const end = toDayjs(this.endTime) || dayjs()
    return {
      startValue: start,
      endValue: end,
      visible: false,
      pickerOpen: false,
      popupStyle: Object.freeze({ zIndex: 4000 }),
      diffHours: 1,
    }
  },
  computed: {
    customTimeText () {
      if (this.startValue && this.endValue && this.showCustomTimeText) {
        const start = toDayjs(this.startValue)
        const end = toDayjs(this.endValue)
        if (start && end) {
          return ` (${start.format('YYYY-MM-DD HH:mm')} ~ ${end.format('YYYY-MM-DD HH:mm')})`
        }
      }
      return ''
    },
  },
  watch: {
    customTime: {
      handler (val) {
        if (!val) return
        if (val.from) {
          let start
          if (this.customTimeUseTimeStamp) {
            start = dayjs(parseInt(val.from + ''))
          } else {
            const hours = +val.from.replace(/^now-(\w+)h$/, '$1').replace('now', 0)
            if (R.is(Number, hours) && !Number.isNaN(hours)) start = dayjs().subtract(hours, 'hour')
          }
          if (start) this.startValue = start
        }
        if (val.to) {
          let end
          if (this.customTimeUseTimeStamp) {
            end = dayjs(parseInt(val.to + ''))
          } else {
            const hours = +val.to.replace(/^now-(\w+)h$/, '$1').replace('now', 0)
            if (R.is(Number, hours) && !Number.isNaN(hours)) end = dayjs().subtract(hours, 'hour')
          }
          if (end) this.endValue = end
        }
      },
      immediate: true,
    },
  },
  created () {
    // 挂到 Popover 内容内，避免点选被当成外部点击；并用高 z-index 盖住弹层内容
    this.getPopupContainer = (triggerNode) => {
      const pop = (triggerNode && triggerNode.closest && triggerNode.closest('.custom-date-time')) ||
        document.querySelector('.custom-date-time')
      return pop || document.body
    }
  },
  methods: {
    isPickerDropdownOpen () {
      return !!document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)')
    },
    handlePopOpenChange (open) {
      if (!open && (this.pickerOpen || this.isPickerDropdownOpen())) {
        this.visible = true
        return
      }
      this.visible = !!open
      if (!open) this.pickerOpen = false
    },
    onPickerOpenChange (open) {
      this.pickerOpen = !!open
      if (open) this.visible = true
    },
    cancel () {
      this.visible = false
      this.pickerOpen = false
    },
    disableFutureDate (v) {
      if (this.allowFutureTime) return false
      const d = toDayjs(v)
      return d && d.isAfter(dayjs().endOf('day'))
    },
    disabledStartDate (startValue) {
      const start = toDayjs(startValue)
      const end = toDayjs(this.endValue)
      if (!start) return false
      if (this.disableFutureDate(start)) return true
      if (end && start.valueOf() > end.valueOf()) return true
      return false
    },
    disabledEndDate (endValue) {
      const end = toDayjs(endValue)
      const start = toDayjs(this.startValue)
      if (!end) return false
      if (this.disableFutureDate(end)) return true
      if (start && start.valueOf() >= end.valueOf()) return true
      return false
    },
    _range (start, end) {
      const result = []
      for (let i = start; i < end; i++) result.push(i)
      return result
    },
    disabledDateTime () {
      if (this.allowFutureTime) return {}
      const currentHour = dayjs().hour()
      return {
        disabledHours: () => this._range(currentHour + 1, 24),
      }
    },
    getCustomTime () {
      const start = toDayjs(this.startValue)
      const end = toDayjs(this.endValue)
      if (this.customTimeUseTimeStamp) {
        return {
          from: start.valueOf(),
          to: end.valueOf(),
        }
      }
      const from = start.diff(dayjs(), 'hour')
      const to = end.diff(dayjs(), 'hour')
      return {
        from: from === 0 ? 'now' : `now${from}h`,
        to: to === 0 ? 'now' : `now${to}h`,
      }
    },
    submit () {
      const start = toDayjs(this.startValue)
      const end = toDayjs(this.endValue)
      if (!start || !end) {
        this.visible = true
        return
      }
      this.diffHours = end.diff(start, 'hour')
      if (this.diffHours < 1) {
        this.visible = true
        return
      }
      this.$emit('update:time', 'custom')
      this.$emit('click', 'custom')
      this.$emit('update:customTime', this.getCustomTime())
      this.visible = false
      this.pickerOpen = false
    },
  },
}
</script>

<style lang="less" scoped>
.monitor-custom-date {
  width: 320px;
}
.monitor-custom-date__row + .monitor-custom-date__row {
  margin-top: 12px;
}
.monitor-custom-date__label {
  margin-bottom: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--oc-color-text-help, rgba(0, 0, 0, 0.45));
}
.monitor-custom-date__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
