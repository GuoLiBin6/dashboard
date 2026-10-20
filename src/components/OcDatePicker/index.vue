<template>
  <a-date-picker
    v-bind="boundAttrs"
    :value="innerValue"
    :format="format"
    :value-format="undefined"
    :picker="picker"
    :disabled-date="disabledDate"
    :allow-clear="allowClear"
    :placeholder="placeholder"
    :get-popup-container="getPopupContainer"
    :popup-style="popupStyle"
    :show-today="showToday"
    :input-read-only="inputReadOnly"
    class="oc-date-picker"
    @update:value="onUpdate"
    @change="onChange"
    @openChange="(...args) => $emit('openChange', ...args)" />
</template>

<script>
import { toDayjs, formatOut } from '@/components/OcPicker/utils'

/**
 * 纯日期选择（antdv4 样式）。不支持 showTime——日期时间请用 OcDateTimePicker。
 */
export default {
  name: 'OcDatePicker',
  compatConfig: { MODE: 3 },
  inheritAttrs: false,
  props: {
    value: { type: [Object, String, Number, Date], default: null },
    format: { type: String, default: 'YYYY-MM-DD' },
    valueFormat: { type: String, default: '' },
    picker: { type: String, default: 'date' },
    disabledDate: { type: Function, default: undefined },
    allowClear: { type: Boolean, default: true },
    placeholder: { type: String, default: undefined },
    getPopupContainer: { type: Function, default: undefined },
    popupStyle: { type: Object, default: undefined },
    showToday: { type: Boolean, default: true },
    inputReadOnly: { type: Boolean, default: false },
  },
  emits: ['update:value', 'change', 'openChange'],
  computed: {
    boundAttrs () {
      const { value, format, valueFormat, picker, disabledDate, allowClear, placeholder, getPopupContainer, popupStyle, showToday, inputReadOnly, ...rest } = this.$attrs
      return rest
    },
    parseFormat () {
      return this.valueFormat || this.format
    },
    innerValue () {
      return toDayjs(this.value, this.parseFormat)
    },
  },
  methods: {
    emitValue (day) {
      const out = formatOut(day, this.valueFormat || '')
      this.$emit('update:value', out)
      this.$emit('change', out)
    },
    onUpdate (v) {
      this.emitValue(v)
    },
    onChange (v) {
      this.emitValue(v)
    },
  },
}
</script>
