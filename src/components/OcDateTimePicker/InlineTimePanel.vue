<script>
import { defineComponent, h, computed } from 'vue'
import dayjs from 'dayjs'

/**
 * 自研时间列（时/分[/秒]）：点选即 onChange，不依赖 vc-picker TimeBody 补丁。
 */
export default defineComponent({
  name: 'OcInlineTimePanel',
  compatConfig: { MODE: 3 },
  props: {
    value: { type: [Object, String, Number, Date], default: null },
    format: { type: String, default: 'HH:mm' },
    hourStep: { type: Number, default: 1 },
    minuteStep: { type: Number, default: 1 },
    secondStep: { type: Number, default: 1 },
    disabledTime: { type: Function, default: undefined },
  },
  emits: ['change'],
  setup (props, { emit }) {
    const showSecond = computed(() => /ss/.test(props.format || ''))
    const panelValue = computed(() => {
      if (props.value && dayjs.isDayjs(props.value) && props.value.isValid()) return props.value
      const d = dayjs(props.value)
      return d.isValid() ? d : dayjs().hour(0).minute(0).second(0)
    })
    const disabled = computed(() => {
      if (!props.disabledTime) return {}
      return props.disabledTime(panelValue.value) || {}
    })

    function units (start, end, step, disabledList) {
      const list = []
      const blocked = typeof disabledList === 'function' ? disabledList() : (disabledList || [])
      for (let i = start; i <= end; i += step) {
        list.push({ value: i, label: String(i).padStart(2, '0'), disabled: blocked.includes(i) })
      }
      return list
    }

    function emitAt (hVal, mVal, sVal) {
      const next = panelValue.value
        .hour(Math.max(0, hVal))
        .minute(Math.max(0, mVal))
        .second(showSecond.value ? Math.max(0, sVal) : 0)
      emit('change', next)
    }

    function renderColumn (key, selected, list, onPick) {
      return h('ul', {
        key,
        class: 'oc-inline-time-panel__column ant-picker-time-panel-column',
        ref: (el) => {
          if (!el || selected < 0 || el.__ocScrolled === selected) return
          const li = el.querySelector(`[data-val="${selected}"]`)
          if (!li) return
          el.__ocScrolled = selected
          el.scrollTop = Math.max(0, li.offsetTop - el.clientHeight / 2 + li.clientHeight / 2)
        },
      }, list.map((u) => h('li', {
        key: u.value,
        'data-val': u.value,
        class: [
          'ant-picker-time-panel-cell',
          u.disabled && 'ant-picker-time-panel-cell-disabled',
          selected === u.value && 'ant-picker-time-panel-cell-selected',
        ],
        onClick: (e) => {
          e.preventDefault()
          e.stopPropagation()
          if (u.disabled) return
          onPick(u.value)
        },
      }, [
        h('div', { class: 'ant-picker-time-panel-cell-inner' }, u.label),
      ])))
    }

    return () => {
      const cur = panelValue.value
      const hVal = cur.hour()
      const mVal = cur.minute()
      const sVal = cur.second()
      const d = disabled.value
      const hourList = units(0, 23, props.hourStep || 1, d.disabledHours)
      const minuteList = units(
        0, 59, props.minuteStep || 1,
        typeof d.disabledMinutes === 'function' ? () => d.disabledMinutes(hVal) : d.disabledMinutes,
      )
      const secondList = showSecond.value
        ? units(
          0, 59, props.secondStep || 1,
          typeof d.disabledSeconds === 'function' ? () => d.disabledSeconds(hVal, mVal) : d.disabledSeconds,
        )
        : []

      const cols = [
        renderColumn('hour', hVal, hourList, (n) => emitAt(n, mVal, sVal)),
        renderColumn('minute', mVal, minuteList, (n) => emitAt(hVal, n, sVal)),
      ]
      if (showSecond.value) {
        cols.push(renderColumn('second', sVal, secondList, (n) => emitAt(hVal, mVal, n)))
      }

      return h('div', { class: 'oc-inline-time-panel ant-picker-panel' }, [
        h('div', { class: 'ant-picker-time-panel' }, [
          h('div', { class: 'ant-picker-content' }, cols),
        ]),
      ])
    }
  },
})
</script>

<style lang="less">
@oc-time-cell-h: 28px;
@oc-time-col-w: 56px;
@oc-time-after-h: 196px;

.oc-inline-time-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border: none;
  overflow: hidden;

  .ant-picker-time-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border-left: none;
  }

  .ant-picker-content {
    display: flex !important;
    flex: 1 1 auto;
    width: 100%;
    height: 100% !important;
    min-height: 0;
  }

  .ant-picker-time-panel-column {
    box-sizing: border-box;
    flex: 1 1 0;
    width: auto;
    min-width: @oc-time-col-w;
    height: 100% !important;
    max-height: 100%;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: auto;
    text-align: left;
    list-style: none;

    &::after {
      display: block;
      height: @oc-time-after-h;
      content: '';
    }

    .ant-picker-time-panel-cell-inner {
      display: block;
      width: calc(100% - 8px);
      height: @oc-time-cell-h;
      margin: 0 4px;
      padding: 0 0 0 12px;
      line-height: @oc-time-cell-h;
      border-radius: 4px;
      cursor: pointer;
    }

    .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
      background: var(--ant-color-primary-bg, #e6f4ff);
    }

    .ant-picker-time-panel-cell-disabled {
      pointer-events: none;
      opacity: 0.35;
    }
  }
}
</style>
