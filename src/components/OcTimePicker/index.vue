<template>
  <a-time-picker
    v-bind="boundAttrs"
    :value="innerValue"
    :format="format"
    :value-format="undefined"
    :allow-clear="allowClear"
    :placeholder="placeholder"
    :disabled-time="disabledTime"
    :get-popup-container="getPopupContainer"
    :popup-style="popupStyle"
    :input-read-only="inputReadOnly"
    :hour-step="hourStep"
    :minute-step="minuteStep"
    :second-step="secondStep"
    class="oc-time-picker"
    @update:value="onUpdate"
    @change="onChange"
    @ok="onOk"
    @openChange="(...args) => $emit('openChange', ...args)" />
</template>

<script>
import { toTimeDayjs, formatOut } from '@/components/OcPicker/utils'

/**
 * 纯时间选择（antdv4 样式）。
 */
export default {
  name: 'OcTimePicker',
  compatConfig: { MODE: 3 },
  inheritAttrs: false,
  props: {
    value: { type: [Object, String, Number, Date], default: null },
    format: { type: String, default: 'HH:mm' },
    valueFormat: { type: String, default: '' },
    allowClear: { type: Boolean, default: true },
    placeholder: { type: String, default: undefined },
    disabledTime: { type: Function, default: undefined },
    getPopupContainer: { type: Function, default: undefined },
    popupStyle: { type: Object, default: undefined },
    inputReadOnly: { type: Boolean, default: false },
    hourStep: { type: Number, default: 1 },
    minuteStep: { type: Number, default: 1 },
    secondStep: { type: Number, default: 1 },
  },
  emits: ['update:value', 'change', 'ok', 'openChange'],
  computed: {
    boundAttrs () {
      const { value, format, valueFormat, allowClear, placeholder, disabledTime, getPopupContainer, popupStyle, inputReadOnly, hourStep, minuteStep, secondStep, ...rest } = this.$attrs
      return rest
    },
    innerValue () {
      return toTimeDayjs(this.value, this.format)
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
    onOk (v) {
      this.emitValue(v)
      this.$emit('ok', formatOut(v, this.valueFormat || ''))
    },
  },
}
</script>
