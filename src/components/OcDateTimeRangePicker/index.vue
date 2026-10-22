<template>
  <div class="oc-date-time-range-picker d-flex align-items-center">
    <oc-date-time-picker
      class="oc-date-time-range-picker__item flex-fill"
      :value="startValue"
      :layout="layout"
      :format="format"
      :value-format="valueFormat"
      :allow-clear="allowClear"
      :disabled-date="rules.disabledStartDate"
      :disabled-time="rules.disabledStartTime"
      :show-now="showNow"
      :get-popup-container="getPopupContainer"
      :popup-style="popupStyle"
      :input-read-only="inputReadOnly"
      :date-placeholder="startPlaceholder"
      @update:value="onStartUpdate"
      @change="onStartChange"
      @ok="(...args) => $emit('ok', ...args)" />
    <span class="oc-date-time-range-picker__sep">{{ separator }}</span>
    <oc-date-time-picker
      class="oc-date-time-range-picker__item flex-fill"
      :value="endValue"
      :layout="layout"
      :format="format"
      :value-format="valueFormat"
      :allow-clear="allowClear"
      :disabled-date="rules.disabledEndDate"
      :disabled-time="rules.disabledEndTime"
      :show-now="showNow"
      :get-popup-container="getPopupContainer"
      :popup-style="popupStyle"
      :input-read-only="inputReadOnly"
      :date-placeholder="endPlaceholder"
      @update:value="onEndUpdate"
      @change="onEndChange"
      @ok="(...args) => $emit('ok', ...args)" />
  </div>
</template>

<script>
import OcDateTimePicker from '@/components/OcDateTimePicker/index.vue'
import { toDayjs, formatOut, createDateTimeRangeRules } from '@/components/OcPicker/utils'

/**
 * 日期时间范围：两个 OcDateTimePicker（默认 combined）+ 内置 range 规则。
 * - allowPast：是否允许早于当前时刻
 * - allowEqual：结束是否允许等于开始
 * value: [start, end]
 */
export default {
  name: 'OcDateTimeRangePicker',
  compatConfig: { MODE: 3 },
  components: { OcDateTimePicker },
  props: {
    value: { type: Array, default: null },
    format: { type: String, default: 'YYYY-MM-DD HH:mm' },
    valueFormat: { type: String, default: '' },
    layout: { type: String, default: 'combined' },
    allowClear: { type: Boolean, default: true },
    allowPast: { type: Boolean, default: false },
    allowEqual: { type: Boolean, default: false },
    separator: { type: String, default: '~' },
    showNow: { type: Boolean, default: true },
    getPopupContainer: { type: Function, default: undefined },
    popupStyle: { type: Object, default: undefined },
    inputReadOnly: { type: Boolean, default: false },
    placeholder: { type: Array, default: undefined },
  },
  emits: ['update:value', 'change', 'ok'],
  data () {
    return {
      startValue: null,
      endValue: null,
    }
  },
  computed: {
    parseFormat () {
      return this.valueFormat || this.format
    },
    startPlaceholder () {
      return (this.placeholder && this.placeholder[0]) || undefined
    },
    endPlaceholder () {
      return (this.placeholder && this.placeholder[1]) || undefined
    },
    rules () {
      return createDateTimeRangeRules({
        getStart: () => this.startValue,
        getEnd: () => this.endValue,
        allowPast: this.allowPast,
        allowEqual: this.allowEqual,
      })
    },
  },
  watch: {
    value: {
      immediate: true,
      handler (v) {
        const start = Array.isArray(v) ? v[0] : null
        const end = Array.isArray(v) ? v[1] : null
        this.startValue = start == null || start === '' ? null : start
        this.endValue = end == null || end === '' ? null : end
      },
    },
  },
  methods: {
    formatSide (val) {
      if (val == null || val === '') return null
      return this.valueFormat ? formatOut(val, this.valueFormat) : (toDayjs(val, this.parseFormat) || null)
    },
    emitRange (start, end) {
      const next = [this.formatSide(start), this.formatSide(end)]
      this.$emit('update:value', next)
      this.$emit('change', next)
    },
    ensureValid (start, end) {
      if (!this.rules.isValidRange(start, end)) {
        return { start, end: null }
      }
      return { start, end }
    },
    onStartUpdate (val) {
      const fixed = this.ensureValid(val, this.endValue)
      this.startValue = fixed.start
      this.endValue = fixed.end
      this.emitRange(fixed.start, fixed.end)
    },
    onEndUpdate (val) {
      const fixed = this.ensureValid(this.startValue, val)
      this.startValue = fixed.start
      this.endValue = fixed.end
      this.emitRange(fixed.start, fixed.end)
    },
    onStartChange (val) {
      this.onStartUpdate(val)
    },
    onEndChange (val) {
      this.onEndUpdate(val)
    },
  },
}
</script>

<style scoped>
.oc-date-time-range-picker__sep {
  margin: 0 8px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
}
</style>
