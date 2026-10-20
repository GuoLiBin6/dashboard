<template>
  <a-range-picker
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
    :input-read-only="inputReadOnly"
    class="oc-range-picker"
    @update:value="onUpdate"
    @change="onChange"
    @openChange="(...args) => $emit('openChange', ...args)"
    @panelChange="(...args) => $emit('panelChange', ...args)" />
</template>

<script>
import { toDayjs, formatRangeOut } from '@/components/OcPicker/utils'

/**
 * 日期范围（可 picker=month）。
 */
export default {
  name: 'OcRangePicker',
  compatConfig: { MODE: 3 },
  inheritAttrs: false,
  props: {
    value: { type: Array, default: null },
    format: { type: String, default: 'YYYY-MM-DD' },
    valueFormat: { type: String, default: '' },
    picker: { type: String, default: 'date' },
    disabledDate: { type: Function, default: undefined },
    allowClear: { type: Boolean, default: true },
    placeholder: { type: [Array, String], default: undefined },
    getPopupContainer: { type: Function, default: undefined },
    popupStyle: { type: Object, default: undefined },
    inputReadOnly: { type: Boolean, default: false },
  },
  emits: ['update:value', 'change', 'openChange', 'panelChange'],
  computed: {
    boundAttrs () {
      const { value, format, valueFormat, picker, disabledDate, allowClear, placeholder, getPopupContainer, popupStyle, inputReadOnly, ...rest } = this.$attrs
      return rest
    },
    parseFormat () {
      return this.valueFormat || this.format
    },
    innerValue () {
      if (!Array.isArray(this.value) || !this.value.length) return null
      return this.value.map(v => toDayjs(v, this.parseFormat))
    },
  },
  methods: {
    emitValue (days) {
      const out = formatRangeOut(days, this.valueFormat || '')
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
