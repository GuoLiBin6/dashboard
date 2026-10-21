<template>
  <a-time-picker
    v-bind="boundAttrs"
    :value="innerValue"
    :open="innerOpen"
    :format="format"
    :value-format="undefined"
    :allow-clear="allowClear"
    :placeholder="placeholder"
    :get-popup-container="getPopupContainer"
    :popup-style="popupStyle"
    :input-read-only="inputReadOnly"
    :show-now="false"
    :panel-render="renderPanel"
    class="oc-time-picker"
    @update:open="setOpen"
    @update:value="onShellUpdate"
    @change="onShellUpdate"
    @openChange="onOpenChange" />
</template>

<script>
import { h, resolveComponent } from 'vue'
import { toTimeDayjs, formatOut } from '@/components/OcPicker/utils'
import OcInlineTimePanel from '@/components/OcDateTimePicker/InlineTimePanel.vue'

/**
 * 纯时间选择：输入壳用 a-time-picker，面板用 OcInlineTimePanel（点选即写入，不依赖 vc-picker 补丁）。
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
    open: { type: Boolean, default: undefined },
    okText: { type: String, default: undefined },
  },
  emits: ['update:value', 'change', 'ok', 'openChange', 'update:open'],
  data () {
    return {
      localOpen: false,
    }
  },
  computed: {
    boundAttrs () {
      const {
        value, format, valueFormat, allowClear, placeholder, disabledTime,
        getPopupContainer, popupStyle, inputReadOnly, hourStep, minuteStep, secondStep,
        open, okText, ...rest
      } = this.$attrs
      return rest
    },
    innerValue () {
      return toTimeDayjs(this.value, this.format)
    },
    innerOpen: {
      get () {
        return this.open !== undefined ? this.open : this.localOpen
      },
      set (v) {
        this.setOpen(v)
      },
    },
    resolvedOkText () {
      return this.okText || this.$t('dialog.ok')
    },
    wrappedDisabledTime () {
      if (!this.disabledTime) return undefined
      return (current) => this.disabledTime(current || this.innerValue) || {}
    },
  },
  methods: {
    setOpen (v) {
      const next = !!v
      this.localOpen = next
      this.$emit('update:open', next)
      this.$emit('openChange', next)
    },
    onOpenChange (v) {
      this.setOpen(v)
    },
    emitValue (day) {
      const out = formatOut(day, this.valueFormat || '')
      this.$emit('update:value', out)
      this.$emit('change', out)
    },
    /** 壳层 clear / 输入变更 */
    onShellUpdate (v) {
      this.emitValue(v)
    },
    onInlineTimeChange (date) {
      if (!date) return
      this.emitValue(toTimeDayjs(date, this.format))
    },
    onOk () {
      this.emitValue(this.innerValue)
      this.$emit('ok', formatOut(this.innerValue, this.valueFormat || ''))
      this.setOpen(false)
    },
    renderPanel () {
      const AButton = resolveComponent('AButton')
      return h('div', {
        class: 'oc-time-picker__panel',
        style: { width: /ss/.test(this.format) ? '224px' : '168px' },
        onMousedown: (e) => {
          // 避免 input blur 导致面板误关
          e.preventDefault()
        },
      }, [
        h('div', { class: 'oc-time-picker__body' }, [
          h(OcInlineTimePanel, {
            value: this.innerValue,
            format: this.format,
            hourStep: this.hourStep,
            minuteStep: this.minuteStep,
            secondStep: this.secondStep,
            disabledTime: this.wrappedDisabledTime,
            onChange: this.onInlineTimeChange,
          }),
        ]),
        h('ul', { class: 'oc-time-picker__ranges' }, [
          h('li', { class: 'oc-time-picker__ok-wrap' }, [
            h(AButton, {
              type: 'primary',
              size: 'small',
              onClick: (e) => {
                e?.stopPropagation?.()
                this.onOk()
              },
            }, () => this.resolvedOkText),
          ]),
        ]),
      ])
    },
  },
}
</script>

<style lang="less">
.oc-time-picker__panel {
  display: flex;
  flex-direction: column;
  width: 168px;
}

.oc-time-picker__body {
  height: 224px;
  overflow: hidden;
}

.oc-time-picker__ranges {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin: 0;
  padding: 4px 12px;
  list-style: none;
  border-top: 1px solid #f0f0f0;
}

.oc-time-picker__ok-wrap {
  margin-left: auto;
}
</style>
