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
          <a-row :gutter="8">
            <a-col :span="14">
              <a-date-picker
                v-model:value="fd.startDate"
                class="w-100"
                format="YYYY-MM-DD"
                :allowClear="false"
                :placeholder="$t('common.text00119')"
                :getPopupContainer="getPopupContainer"
                :popupStyle="popupStyle"
                @change="syncStart"
                @openChange="onPickerOpenChange" />
            </a-col>
            <a-col :span="10">
              <a-time-picker
                v-model:value="fd.startTime"
                class="w-100"
                format="HH:mm"
                :allowClear="false"
                :getPopupContainer="getPopupContainer"
                :popupStyle="popupStyle"
                @change="syncStart"
                @ok="syncStart"
                @openChange="onPickerOpenChange" />
            </a-col>
          </a-row>
        </div>
        <div class="monitor-custom-date__row">
          <div class="monitor-custom-date__label">{{ $t('common.text00120') }}</div>
          <a-row :gutter="8">
            <a-col :span="14">
              <a-date-picker
                v-model:value="fd.endDate"
                class="w-100"
                format="YYYY-MM-DD"
                :allowClear="false"
                :placeholder="$t('common.text00120')"
                :getPopupContainer="getPopupContainer"
                :popupStyle="popupStyle"
                @change="syncEnd"
                @openChange="onPickerOpenChange" />
            </a-col>
            <a-col :span="10">
              <a-time-picker
                v-model:value="fd.endTime"
                class="w-100"
                format="HH:mm"
                :allowClear="false"
                :getPopupContainer="getPopupContainer"
                :popupStyle="popupStyle"
                @change="syncEnd"
                @ok="syncEnd"
                @openChange="onPickerOpenChange" />
            </a-col>
          </a-row>
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
import customParseFormat from 'dayjs/plugin/customParseFormat'
import moment from 'moment'

dayjs.extend(customParseFormat)

function toDayjs (val) {
  if (val == null || val === '') return null
  if (dayjs.isDayjs(val)) return val
  if (val && typeof val.toDate === 'function') return dayjs(val.toDate())
  const d = dayjs(val)
  return d.isValid() ? d : null
}

function toTime (val) {
  const d = toDayjs(val)
  if (!d) return dayjs('00:00', 'HH:mm')
  return dayjs(d.format('HH:mm'), 'HH:mm')
}

function mergeDateTime (dateVal, timeVal) {
  const date = toDayjs(dateVal)
  const time = toTime(timeVal)
  if (!date) return null
  return dayjs(`${date.format('YYYY-MM-DD')} ${time.format('HH:mm')}`, 'YYYY-MM-DD HH:mm')
}

export default {
  name: 'MonitorCustomDate',
  // 与 DateSelect 一致：子树按 Vue3 行为，避免 compat 弄丢面板选择
  compatConfig: { MODE: 3 },
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
      fd: {
        startDate: start,
        startTime: toTime(start),
        endDate: end,
        endTime: toTime(end),
      },
      // 合并后的完整时间，供文案/提交使用
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
        return ` (${this.startValue.format('YYYY-MM-DD HH:mm')} ~ ${this.endValue.format('YYYY-MM-DD HH:mm')})`
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
          if (start) this.applyStart(start)
        }
        if (val.to) {
          let end
          if (this.customTimeUseTimeStamp) {
            end = dayjs(parseInt(val.to + ''))
          } else {
            const hours = +val.to.replace(/^now-(\w+)h$/, '$1').replace('now', 0)
            if (R.is(Number, hours) && !Number.isNaN(hours)) end = dayjs().subtract(hours, 'hour')
          }
          if (end) this.applyEnd(end)
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
    applyStart (val) {
      const d = toDayjs(val)
      if (!d) return
      this.fd.startDate = d
      this.fd.startTime = toTime(d)
      this.startValue = d
    },
    applyEnd (val) {
      const d = toDayjs(val)
      if (!d) return
      this.fd.endDate = d
      this.fd.endTime = toTime(d)
      this.endValue = d
    },
    syncStart () {
      this.startValue = mergeDateTime(this.fd.startDate, this.fd.startTime)
    },
    syncEnd () {
      this.endValue = mergeDateTime(this.fd.endDate, this.fd.endTime)
    },
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
    getCustomTime () {
      const start = this.startValue
      const end = this.endValue
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
      this.syncStart()
      this.syncEnd()
      const start = this.startValue
      const end = this.endValue
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
  width: 360px;
}
.monitor-custom-date__row + .monitor-custom-date__row {
  margin-top: 12px;
}
.monitor-custom-date__label {
  margin-bottom: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.45);
}
.monitor-custom-date__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
