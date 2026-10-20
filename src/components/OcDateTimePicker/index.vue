<template>
  <!-- combined：自研拼装面板（日期点选可用 + 时间列可用）；选日期不关层 -->
  <div
    v-if="layout === 'combined'"
    class="oc-date-time-picker oc-date-time-picker--combined"
    @click="onCombinedTriggerClick">
    <a-date-picker
      :value="mergedValue"
      :open="innerOpen"
      class="w-100"
      :format="format"
      :allow-clear="allowClear"
      :disabled-date="disabledDate"
      :placeholder="datePlaceholder"
      :get-popup-container="getPopupContainer"
      :popup-style="popupStyle"
      :input-read-only="inputReadOnly"
      :show-today="false"
      :show-now="false"
      :panel-render="renderCombinedPanel"
      @update:open="setOpen"
      @update:value="onCombinedDatePick"
      @change="onCombinedDatePick"
      @openChange="onOpenChange" />
  </div>
  <!-- split：日期 / 时间两个面板（默认） -->
  <div
    v-else
    class="oc-date-time-picker"
    :class="{ 'oc-date-time-picker--block': block }">
    <a-row :gutter="gutter" type="flex">
      <a-col :span="dateSpan">
        <a-date-picker
          v-model:value="datePart"
          class="w-100"
          :format="dateFormat"
          :allow-clear="allowClear"
          :disabled-date="disabledDate"
          :placeholder="datePlaceholder"
          :get-popup-container="getPopupContainer"
          :popup-style="popupStyle"
          :input-read-only="inputReadOnly"
          :show-today="showToday"
          @change="syncFromParts"
          @openChange="(...args) => $emit('openChange', ...args)">
          <template v-if="$slots.renderExtraFooter" #renderExtraFooter>
            <slot name="renderExtraFooter" />
          </template>
        </a-date-picker>
      </a-col>
      <a-col :span="timeSpan">
        <a-time-picker
          v-model:value="timePart"
          class="w-100"
          :format="timeFormat"
          :allow-clear="allowClear"
          :disabled-time="wrappedDisabledTime"
          :placeholder="timePlaceholder"
          :get-popup-container="getPopupContainer"
          :popup-style="popupStyle"
          :input-read-only="inputReadOnly"
          :hour-step="hourStep"
          :minute-step="minuteStep"
          :second-step="secondStep"
          @change="syncFromParts"
          @ok="onOk"
          @openChange="(...args) => $emit('openChange', ...args)" />
      </a-col>
    </a-row>
  </div>
</template>

<script>
import { h, resolveComponent } from 'vue'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { toDayjs, toTimeDayjs, mergeDateTime, formatOut } from '@/components/OcPicker/utils'
import OcInlineTimePanel from './InlineTimePanel.vue'

dayjs.extend(customParseFormat)

/**
 * 日期+时间：
 * - split：拆成两个面板（默认）
 * - combined：单输入；面板内左侧日期、右侧自研时间列；选日期不关层
 */
export default {
  name: 'OcDateTimePicker',
  compatConfig: { MODE: 3 },
  props: {
    value: { type: [Object, String, Number, Date], default: null },
    format: { type: String, default: 'YYYY-MM-DD HH:mm' },
    valueFormat: { type: String, default: '' },
    disabledDate: { type: Function, default: undefined },
    disabledTime: { type: Function, default: undefined },
    allowClear: { type: Boolean, default: true },
    datePlaceholder: { type: String, default: undefined },
    timePlaceholder: { type: String, default: undefined },
    getPopupContainer: { type: Function, default: undefined },
    popupStyle: { type: Object, default: undefined },
    inputReadOnly: { type: Boolean, default: false },
    showToday: { type: Boolean, default: true },
    hourStep: { type: Number, default: 1 },
    minuteStep: { type: Number, default: 1 },
    secondStep: { type: Number, default: 1 },
    dateSpan: { type: Number, default: 14 },
    timeSpan: { type: Number, default: 10 },
    gutter: { type: Number, default: 8 },
    block: { type: Boolean, default: false },
    layout: { type: String, default: 'split' },
    open: { type: Boolean, default: undefined },
    okText: { type: String, default: undefined },
    showNow: { type: Boolean, default: true },
    nowText: { type: String, default: undefined },
  },
  emits: ['update:value', 'change', 'openChange', 'update:open', 'ok'],
  data () {
    return {
      datePart: null,
      timePart: null,
      syncing: false,
      localOpen: false,
      /** 面板内操作中：禁止因选日期而关层 */
      panelAlive: false,
      /** 确定 / 此刻 允许关闭 */
      allowClose: false,
    }
  },
  computed: {
    dateFormat () {
      return 'YYYY-MM-DD'
    },
    timeFormat () {
      if (this.format.includes('HH:mm:ss') || this.format.includes('hh:mm:ss')) return 'HH:mm:ss'
      return 'HH:mm'
    },
    parseFormat () {
      return this.valueFormat || this.format
    },
    /** 输入框展示完整日期时间 */
    displayValue () {
      return mergeDateTime(this.datePart, this.timePart, this.timeFormat)
    },
    mergedValue () {
      return this.displayValue
    },
    innerOpen: {
      get () {
        return this.open !== undefined ? this.open : this.localOpen
      },
      set (v) {
        this.setOpen(v)
      },
    },
    wrappedDisabledTime () {
      if (!this.disabledTime) return undefined
      return (current) => {
        const base = current || this.datePart || toDayjs(this.value, this.parseFormat) || dayjs()
        return this.disabledTime(base) || {}
      }
    },
    resolvedOkText () {
      return this.okText || this.$t('dialog.ok')
    },
    resolvedNowText () {
      return this.nowText || '此刻'
    },
    isNowSelectable () {
      const now = dayjs()
      if (this.disabledDate && this.disabledDate(now)) return false
      if (!this.disabledTime) return true
      const conf = this.disabledTime(now) || {}
      const h = now.hour()
      const m = now.minute()
      const s = now.second()
      if (typeof conf.disabledHours === 'function' && conf.disabledHours().includes(h)) return false
      if (typeof conf.disabledMinutes === 'function' && conf.disabledMinutes(h).includes(m)) return false
      if (typeof conf.disabledSeconds === 'function' && conf.disabledSeconds(h, m).includes(s)) return false
      return true
    },
  },
  watch: {
    value: {
      immediate: true,
      handler (v) {
        if (this.syncing) return
        this.applyFromValue(v)
      },
    },
  },
  methods: {
    markPanelAlive () {
      this.panelAlive = true
    },
    forceKeepOpen () {
      this.localOpen = true
      this.$emit('update:open', true)
      this.$emit('openChange', true)
    },
    setOpen (v) {
      const next = !!v
      if (!next && this.layout === 'combined' && !this.allowClose) {
        // 选日期会先关层；面板内操作时强制保持打开
        if (this.panelAlive) {
          this.$nextTick(() => {
            this.forceKeepOpen()
            // 下一轮再清，避免连续点选被误关
            this.$nextTick(() => {
              this.panelAlive = false
            })
          })
          return
        }
      }
      this.allowClose = false
      this.panelAlive = false
      this.localOpen = next
      this.$emit('update:open', next)
      this.$emit('openChange', next)
    },
    onOpenChange (v) {
      this.setOpen(v)
    },
    onCombinedTriggerClick () {
      if (!this.innerOpen) this.setOpen(true)
    },
    applyFromValue (v) {
      const d = toDayjs(v, this.parseFormat)
      if (!d) {
        this.datePart = null
        this.timePart = null
        return
      }
      this.datePart = d
      this.timePart = toTimeDayjs(d, this.timeFormat)
    },
    syncFromParts () {
      if (!this.datePart && this.allowClear) {
        this.emitOut(null)
        return
      }
      if (!this.datePart) return
      this.emitOut(mergeDateTime(this.datePart, this.timePart, this.timeFormat))
    },
    emitOut (day) {
      this.syncing = true
      const out = formatOut(day, this.valueFormat || '')
      this.$emit('update:value', out)
      this.$emit('change', out)
      this.$nextTick(() => { this.syncing = false })
    },
    onCombinedDatePick (v) {
      this.markPanelAlive()
      const merged = mergeDateTime(v, this.timePart, this.timeFormat)
      this.applyFromValue(merged)
      this.emitOut(merged)
      // 再保险：选完日期后强制保持打开
      this.$nextTick(() => this.forceKeepOpen())
    },
    onInlineTimeChange (date) {
      if (!date) return
      this.markPanelAlive()
      const base = this.datePart || dayjs()
      const merged = base
        .hour(date.hour())
        .minute(date.minute())
        .second(this.timeFormat.includes('ss') ? date.second() : 0)
      this.applyFromValue(merged)
      this.emitOut(merged)
    },
    onOk () {
      this.allowClose = true
      this.panelAlive = false
      this.syncFromParts()
      this.setOpen(false)
      this.$emit('ok', this.mergedValue)
    },
    selectNow () {
      if (!this.isNowSelectable) return
      this.allowClose = true
      this.panelAlive = false
      const now = dayjs()
      this.applyFromValue(now)
      this.emitOut(now)
      this.setOpen(false)
      this.$emit('ok', now)
    },
    /**
     * panelRender 收到的是整棵 panel-layout；从中取出日期面板，再拼自研时间列与 footer。
     * 输入框展示用 format 完整串：通过 input 的 value 由 datePart+timePart 合并后写回。
     */
    renderCombinedPanel (originPanel) {
      const AButton = resolveComponent('AButton')
      const rangesChildren = []
      if (this.showNow) {
        rangesChildren.push(h('li', {
          key: 'now',
          class: ['oc-dt-combined__now', !this.isNowSelectable && 'oc-dt-combined__now--disabled'],
        }, [
          h('a', {
            class: 'oc-dt-combined__now-btn',
            onClick: (e) => {
              e?.stopPropagation?.()
              e?.preventDefault?.()
              this.selectNow()
            },
          }, this.resolvedNowText),
        ]))
      }
      rangesChildren.push(h('li', { key: 'ok', class: 'oc-dt-combined__ok-wrap' }, [
        h(AButton, {
          type: 'primary',
          size: 'small',
          class: 'oc-dt-combined__ok',
          onClick: (e) => {
            e?.stopPropagation?.()
            this.onOk()
          },
        }, () => this.resolvedOkText),
      ]))

      return h('div', {
        class: 'oc-dt-combined',
        onMousedown: (e) => {
          // 与 antd 一致：阻止 input blur 导致误关；并标记面板交互中
          e.preventDefault()
          this.markPanelAlive()
        },
      }, [
        h('div', { class: 'oc-dt-combined__main' }, [
          h('div', { class: 'oc-dt-combined__date' }, [originPanel]),
          h('div', { class: 'oc-dt-combined__time' }, [
            h(OcInlineTimePanel, {
              value: this.mergedValue,
              format: this.timeFormat,
              hourStep: this.hourStep,
              minuteStep: this.minuteStep,
              secondStep: this.secondStep,
              disabledTime: this.wrappedDisabledTime,
              onChange: this.onInlineTimeChange,
            }),
          ]),
        ]),
        h('div', { class: 'oc-dt-combined__extra' }, this.$slots.renderExtraFooter?.()),
        h('ul', { class: 'oc-dt-combined__ranges' }, rangesChildren),
      ])
    },
  },
}
</script>

<style scoped>
.oc-date-time-picker--block {
  width: 100%;
}
.oc-date-time-picker--block :deep(.ant-row) {
  width: 100%;
}
.oc-date-time-picker--combined {
  display: inline-block;
  max-width: 100%;
}
</style>

<style lang="less">
.oc-dt-combined {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  max-width: 100%;

  .oc-dt-combined__main {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: max-content;
    max-width: 100%;
    padding-right: 112px;
    box-sizing: content-box;
  }

  /* 藏掉 origin 里可能带的 footer，避免和自定义 footer 重复 */
  .oc-dt-combined__date {
    .ant-picker-footer,
    .ant-picker-footer-extra,
    .ant-picker-ranges {
      display: none !important;
    }
  }

  .oc-dt-combined__time {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 112px;
    border-left: 1px solid #f0f0f0;
    overflow: hidden;
  }

  .oc-dt-combined__extra {
    box-sizing: border-box;
    width: 0;
    min-width: 100%;
    padding: 4px 12px;
    line-height: 1.8;
    border-top: 1px solid #f0f0f0;
    white-space: normal;
  }

  .oc-dt-combined__ranges {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 0;
    min-width: 100%;
    margin: 0;
    padding: 4px 12px;
    list-style: none;
    border-top: 1px solid #f0f0f0;
  }

  .oc-dt-combined__now-btn {
    color: var(--ant-color-primary, #1890ff);
    cursor: pointer;
  }

  .oc-dt-combined__now--disabled .oc-dt-combined__now-btn {
    color: rgba(0, 0, 0, 0.25);
    cursor: not-allowed;
    pointer-events: none;
  }

  .oc-dt-combined__ok-wrap {
    margin-left: auto;
  }
}
</style>
