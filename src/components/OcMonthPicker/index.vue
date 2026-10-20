<template>
  <oc-date-picker
    v-bind="$attrs"
    :value="value"
    picker="month"
    :format="format"
    :value-format="valueFormat"
    :disabled-date="disabledDate"
    :allow-clear="allowClear"
    :placeholder="placeholder"
    :get-popup-container="getPopupContainer"
    class="oc-month-picker"
    @update:value="v => $emit('update:value', v)"
    @change="v => $emit('change', v)"
    @openChange="(...args) => $emit('openChange', ...args)" />
</template>

<script>
import OcDatePicker from '@/components/OcDatePicker/index.vue'

/**
 * 月份选择：基于 OcDatePicker picker=month。
 */
export default {
  name: 'OcMonthPicker',
  compatConfig: { MODE: 3 },
  components: { OcDatePicker },
  inheritAttrs: false,
  props: {
    value: { type: [Object, String, Number, Date], default: null },
    format: { type: String, default: 'YYYY-MM' },
    valueFormat: { type: String, default: '' },
    disabledDate: { type: Function, default: undefined },
    allowClear: { type: Boolean, default: true },
    placeholder: { type: String, default: undefined },
    getPopupContainer: { type: Function, default: undefined },
  },
  emits: ['update:value', 'change', 'openChange'],
}
</script>
