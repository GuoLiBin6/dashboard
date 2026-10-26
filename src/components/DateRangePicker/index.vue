<template>
  <div ref="trigger" class="oc-date-range" @click="handleClick">
    <a-range-picker
      class="oc-date-range__input"
      :value="dayjsValue"
      format="YYYY-MM-DD"
      :allowClear="false"
      :open="false"
      :inputReadOnly="true"
      @openChange="showPanel" />
    <!-- teleport：独立使用挂 body 防裁切；嵌在 Popconfirm 内时关掉，避免点选被当成「点外面」关掉外层 -->
    <teleport to="body" :disabled="!teleport">
      <div
        v-if="visible"
        ref="panel"
        class="oc-date-range__dropdown"
        :style="dropdownStyle"
        @mousedown.stop
        @click.stop>
        <div class="oc-date-range__inputs">
          <input :value="textLeft" type="text" readonly class="oc-date-range__text" />
          <span class="oc-date-range__sep">~</span>
          <input :value="textRight" type="text" readonly class="oc-date-range__text" />
        </div>
        <div class="oc-date-range__panels">
          <div class="oc-date-range__part">
            <div class="oc-date-range__header">
              <a class="oc-date-range__nav oc-date-range__nav--super-prev" title="<<" @click="shiftMonth(-12)" />
              <a class="oc-date-range__nav oc-date-range__nav--prev" title="<" @click="shiftMonth(-1)" />
              <span class="oc-date-range__title">{{ leftTitle }}</span>
              <a
                v-if="monthDiff > 1"
                class="oc-date-range__nav oc-date-range__nav--next"
                title=">"
                @click="shiftLeftMonth(1)" />
            </div>
            <div class="oc-date-range__weekdays">
              <span v-for="w in weekdays" :key="`l-${w}`">{{ w }}</span>
            </div>
            <div class="oc-date-range__body">
              <div
                v-for="(cell, idx) in leftCells"
                :key="`l-${idx}`"
                class="oc-date-range__cell"
                :class="cellClass(cell)">
                <a
                  v-if="cell"
                  class="oc-date-range__day"
                  @click="(e) => handleDayClick(e, cell)"
                  @mouseover="handleDayOver(cell)">
                  {{ cell.date() }}
                </a>
              </div>
            </div>
          </div>
          <div class="oc-date-range__part">
            <div class="oc-date-range__header">
              <a
                v-if="monthDiff > 1"
                class="oc-date-range__nav oc-date-range__nav--prev"
                title="<"
                @click="shiftRightMonth(-1)" />
              <span class="oc-date-range__title">{{ rightTitle }}</span>
              <a class="oc-date-range__nav oc-date-range__nav--next" title=">" @click="shiftMonth(1)" />
              <a class="oc-date-range__nav oc-date-range__nav--super-next" title=">>" @click="shiftMonth(12)" />
            </div>
            <div class="oc-date-range__weekdays">
              <span v-for="w in weekdays" :key="`r-${w}`">{{ w }}</span>
            </div>
            <div class="oc-date-range__body">
              <div
                v-for="(cell, idx) in rightCells"
                :key="`r-${idx}`"
                class="oc-date-range__cell"
                :class="cellClass(cell)">
                <a
                  v-if="cell"
                  class="oc-date-range__day"
                  @click="(e) => handleDayClick(e, cell)"
                  @mouseover="handleDayOver(cell)">
                  {{ cell.date() }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import dayjs from '@/utils/dayjs'

function toDayjs (val) {
  if (val == null || val === '') return null
  if (dayjs.isDayjs(val)) return val
  if (val && typeof val.toDate === 'function') return dayjs(val.toDate())
  const d = dayjs(val)
  return d.isValid() ? d : null
}

function startOfMonth (d) {
  return d.startOf('month')
}

function buildMonthCells (month) {
  const start = startOfMonth(month)
  const daysInMonth = start.daysInMonth()
  const weekStartDay = dayjs().startOf('week').day()
  const firstDow = start.day()
  const pad = (firstDow - weekStartDay + 7) % 7
  const cells = []
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(start.date(d))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  while (cells.length < 42) cells.push(null)
  return cells
}

export default {
  name: 'DateRangePicker',
  model: {
    prop: 'value',
    event: 'change',
  },
  props: {
    value: Array,
    panelVisible: Boolean,
    disabledDate: Function,
    // true：选完两端即关面板（独立使用）；false：保持打开，由外层「确定」关闭（如费用 CustomDate）
    closeOnSelect: {
      type: Boolean,
      default: true,
    },
    // false：不挂 body（嵌在 Popconfirm 等容器内时用，点击不会误关外层）
    teleport: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    const start = toDayjs(this.value && this.value[0]) || dayjs()
    const end = toDayjs(this.value && this.value[1]) || start
    const leftMonth = startOfMonth(start)
    let rightMonth = startOfMonth(end)
    if (!rightMonth.isAfter(leftMonth, 'month')) {
      rightMonth = leftMonth.add(1, 'month')
    }
    return {
      visible: false,
      leftMonth,
      rightMonth,
      selected: [toDayjs(this.value && this.value[0]), toDayjs(this.value && this.value[1])],
      changeIndex: 0,
      hoverValue: null,
      dropdownStyle: {},
    }
  },
  computed: {
    dayjsValue () {
      return [
        toDayjs(this.value && this.value[0]),
        toDayjs(this.value && this.value[1]),
      ]
    },
    textLeft () {
      const d = this.selected[0]
      return d ? d.format('YYYY-MM-DD') : ''
    },
    textRight () {
      const d = this.selected[1]
      return d ? d.format('YYYY-MM-DD') : ''
    },
    leftTitle () {
      return this.formatPanelTitle(this.leftMonth)
    },
    rightTitle () {
      return this.formatPanelTitle(this.rightMonth)
    },
    monthDiff () {
      return this.rightMonth.startOf('month').diff(this.leftMonth.startOf('month'), 'month')
    },
    weekdays () {
      // 用当前 locale 的短星期，从周日或周一开始由 dayjs locale 决定
      const base = dayjs().startOf('week')
      return Array.from({ length: 7 }, (_, i) => base.add(i, 'day').format('dd'))
    },
    leftCells () {
      return buildMonthCells(this.leftMonth)
    },
    rightCells () {
      return buildMonthCells(this.rightMonth)
    },
  },
  watch: {
    panelVisible (val) {
      if (!val) this.visible = false
    },
    value: {
      deep: true,
      handler (val) {
        if (this.changeIndex !== 0) return
        this.selected = [toDayjs(val && val[0]), toDayjs(val && val[1])]
      },
    },
    visible (val) {
      this.$emit('openChange', val)
      if (!val) {
        this.unbindPositionListeners()
        this.hoverValue = null
        this.changeIndex = 0
        this.selected = [toDayjs(this.value && this.value[0]), toDayjs(this.value && this.value[1])]
        const start = this.selected[0] || dayjs()
        const end = this.selected[1] || start
        this.leftMonth = startOfMonth(start)
        this.rightMonth = startOfMonth(end)
        if (!this.rightMonth.isAfter(this.leftMonth, 'month')) {
          this.rightMonth = this.leftMonth.add(1, 'month')
        }
      }
    },
  },
  created () {
    if (this.$bus) {
      this.$bus.$on('app-action', (e) => {
        if (!this.visible || !e || !e.target) return
        const panel = this.$refs.panel
        const trigger = this.$refs.trigger
        if (panel && panel.contains(e.target)) return
        if (trigger && trigger.contains(e.target)) return
        this.visible = false
      })
    }
  },
  beforeUnmount () {
    this.unbindPositionListeners()
  },
  // Vue2 compat
  beforeDestroy () {
    this.unbindPositionListeners()
  },
  methods: {
    formatPanelTitle (month) {
      const loc = (this.$store && this.$store.getters && this.$store.getters.setting && this.$store.getters.setting.language) ||
        (this.$i18n && this.$i18n.locale) || ''
      if (String(loc).toLowerCase().startsWith('zh')) {
        return `${month.year()}年 ${month.month() + 1}月`
      }
      return month.format('MMM YYYY')
    },
    bindPositionListeners () {
      this._onReposition = () => this.updateDropdownPosition()
      window.addEventListener('resize', this._onReposition)
      window.addEventListener('scroll', this._onReposition, true)
    },
    unbindPositionListeners () {
      if (!this._onReposition) return
      window.removeEventListener('resize', this._onReposition)
      window.removeEventListener('scroll', this._onReposition, true)
      this._onReposition = null
    },
    updateDropdownPosition () {
      const el = this.$refs.trigger
      if (!el) return
      const rect = el.getBoundingClientRect()
      const panelW = 560
      const gap = 4
      let left = rect.left
      let top = rect.bottom + gap
      // 右侧超出视口时左移
      if (left + panelW > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelW - 8)
      }
      // 下方空间不足时翻到上方（先按估计高度；下一帧再按真实高度微调）
      const estH = 360
      if (top + estH > window.innerHeight - 8 && rect.top > estH) {
        top = rect.top - estH - gap
      }
      this.dropdownStyle = {
        position: 'fixed',
        left: `${Math.max(8, left)}px`,
        top: `${Math.max(8, top)}px`,
        zIndex: 1100,
      }
      this.$nextTick(() => {
        const panel = this.$refs.panel
        if (!panel) return
        const h = panel.offsetHeight
        let nextTop = rect.bottom + gap
        if (nextTop + h > window.innerHeight - 8 && rect.top > h + gap) {
          nextTop = rect.top - h - gap
        }
        this.dropdownStyle = {
          ...this.dropdownStyle,
          top: `${Math.max(8, nextTop)}px`,
        }
      })
    },
    showPanel () {
      // 打开前用 value 同步选中态与面板月份，避免与外部已确认值不一致
      this.changeIndex = 0
      this.hoverValue = null
      this.selected = [toDayjs(this.value && this.value[0]), toDayjs(this.value && this.value[1])]
      const start = this.selected[0] || dayjs()
      const end = this.selected[1] || start
      this.leftMonth = startOfMonth(start)
      this.rightMonth = startOfMonth(end)
      if (!this.rightMonth.isAfter(this.leftMonth, 'month')) {
        this.rightMonth = this.leftMonth.add(1, 'month')
      }
      this.visible = true
      this.$nextTick(() => {
        this.updateDropdownPosition()
        this.bindPositionListeners()
      })
    },
    hiddenPanel () {
      this.visible = false
      this.unbindPositionListeners()
    },
    handleClick (e) {
      this.showPanel()
      e.preventDefault()
      e.stopPropagation()
    },
    shiftMonth (diff) {
      this.leftMonth = this.leftMonth.add(diff, 'month')
      this.rightMonth = this.rightMonth.add(diff, 'month')
    },
    shiftLeftMonth (diff) {
      const next = this.leftMonth.add(diff, 'month')
      if (next.isBefore(this.rightMonth, 'month')) {
        this.leftMonth = next
      }
    },
    shiftRightMonth (diff) {
      const next = this.rightMonth.add(diff, 'month')
      if (next.isAfter(this.leftMonth, 'month')) {
        this.rightMonth = next
      }
    },
    isDisabled (cell) {
      if (!cell) return true
      if (typeof this.disabledDate === 'function') return !!this.disabledDate(cell)
      return false
    },
    sameDay (a, b) {
      return !!(a && b && a.isSame(b, 'day'))
    },
    cellClass (cell) {
      if (!cell) return { 'is-empty': true }
      const start = this.selected[0]
      const end = this.selected[1]
      const hover = this.hoverValue
      const isStart = this.sameDay(cell, start)
      const isEnd = this.sameDay(cell, end) || (!!start && !end && this.sameDay(cell, hover))
      let inRange = false
      if (start && end) {
        inRange = cell.isAfter(start, 'day') && cell.isBefore(end, 'day')
      } else if (start && hover && !end) {
        const a = start.isBefore(hover, 'day') ? start : hover
        const b = start.isBefore(hover, 'day') ? hover : start
        inRange = cell.isAfter(a, 'day') && cell.isBefore(b, 'day')
      }
      return {
        'is-selected': isStart || isEnd,
        'is-range-start': start && hover && !end
          ? this.sameDay(cell, start.isBefore(hover, 'day') ? start : hover)
          : isStart,
        'is-range-end': start && hover && !end
          ? this.sameDay(cell, start.isBefore(hover, 'day') ? hover : start)
          : this.sameDay(cell, end),
        'is-in-range': inRange,
        'is-disabled': this.isDisabled(cell),
        'is-today': cell.isSame(dayjs(), 'day'),
      }
    },
    handleDayOver (cell) {
      if (this.isDisabled(cell)) return
      if (this.selected[0] && !this.selected[1]) {
        this.hoverValue = cell
      }
    },
    handleDayClick (e, cell) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (this.isDisabled(cell)) return

      if (this.changeIndex === 0) {
        // 第一次点：只记一端，不切换面板、不强制左右
        this.selected = [cell, null]
        this.changeIndex = 1
        this.hoverValue = null
        this.$emit('calendarChange', [cell, null])
        return
      }

      let a = this.selected[0]
      let b = cell
      if (a && b && a.isAfter(b, 'day')) {
        const t = a
        a = b
        b = t
      }
      this.selected = [a, b]
      this.changeIndex = 0
      this.hoverValue = null
      // 同步回写，避免关面板时 value 尚未更新导致第二端丢失
      this.$emit('calendarChange', [a, b])
      this.$emit('change', [a, b])
      this.$emit('update:value', [a, b])
      if (this.closeOnSelect) {
        this.$nextTick(() => {
          this.visible = false
        })
      }
      // closeOnSelect=false 时保持打开，由外层「确定」关闭（避免 teleport 点击关掉 popconfirm）
    },
  },
}
</script>

<style lang="less" scoped>
.oc-date-range {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.oc-date-range__input {
  width: 280px;
  max-width: 100%;
}

.oc-date-range__dropdown {
  width: 560px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.oc-date-range__inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.oc-date-range__text {
  flex: 1;
  min-width: 0;
  height: 24px;
  padding: 0;
  border: 0;
  outline: none;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 24px;
  background: transparent;
}

.oc-date-range__sep {
  flex: none;
  color: rgba(0, 0, 0, 0.45);
}

.oc-date-range__panels {
  display: flex;
  width: 100%;
}

.oc-date-range__part {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  box-sizing: border-box;
}

.oc-date-range__part + .oc-date-range__part {
  border-left: 1px solid #f0f0f0;
}

.oc-date-range__header {
  position: relative;
  height: 40px;
  line-height: 40px;
  text-align: center;
  user-select: none;
}

.oc-date-range__title {
  display: inline-block;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.oc-date-range__nav {
  position: absolute;
  top: 0;
  width: 24px;
  height: 40px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;

  &::before {
    position: absolute;
    top: 50%;
    width: 8px;
    height: 8px;
    margin-top: -5px;
    border: 0 solid #aaa;
    border-width: 1.5px 0 0 1.5px;
    border-radius: 1px;
    content: '';
  }

  &:hover::before {
    border-color: rgba(0, 0, 0, 0.65);
  }
}

.oc-date-range__nav--prev {
  left: 28px;

  &::before {
    left: 8px;
    transform: rotate(-45deg) scale(0.85);
  }
}

.oc-date-range__nav--super-prev {
  left: 4px;

  &::before {
    left: 6px;
    transform: rotate(-45deg) scale(0.85);
  }

  &::after {
    position: absolute;
    top: 50%;
    left: 11px;
    width: 8px;
    height: 8px;
    margin-top: -5px;
    border: 0 solid #aaa;
    border-width: 1.5px 0 0 1.5px;
    border-radius: 1px;
    transform: rotate(-45deg) scale(0.85);
    content: '';
  }

  &:hover::after {
    border-color: rgba(0, 0, 0, 0.65);
  }
}

.oc-date-range__nav--next {
  right: 28px;

  &::before {
    right: 8px;
    left: auto;
    transform: rotate(135deg) scale(0.85);
  }
}

.oc-date-range__nav--super-next {
  right: 4px;

  &::before {
    right: 11px;
    left: auto;
    transform: rotate(135deg) scale(0.85);
  }

  &::after {
    position: absolute;
    top: 50%;
    right: 6px;
    width: 8px;
    height: 8px;
    margin-top: -5px;
    border: 0 solid #aaa;
    border-width: 1.5px 0 0 1.5px;
    border-radius: 1px;
    transform: rotate(135deg) scale(0.85);
    content: '';
  }

  &:hover::after {
    border-color: rgba(0, 0, 0, 0.65);
  }
}

.oc-date-range__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
  line-height: 28px;
}

.oc-date-range__body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 216px;
  padding: 4px 8px 12px;
  box-sizing: border-box;
}

.oc-date-range__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
}

.oc-date-range__cell.is-in-range::before {
  position: absolute;
  top: 4px;
  right: 0;
  bottom: 4px;
  left: 0;
  background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, transparent);
  content: '';
}

.oc-date-range__cell.is-range-start.is-in-range::before {
  left: 50%;
}

.oc-date-range__cell.is-range-end.is-in-range::before {
  right: 50%;
}

.oc-date-range__day {
  position: relative;
  z-index: 1;
  display: inline-block;
  width: 24px;
  height: 24px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 24px;
  text-align: center;
  border-radius: 2px;
  transition: background 0.15s ease;
}

.oc-date-range__day:hover {
  background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, transparent);
  cursor: pointer;
}

.oc-date-range__cell.is-today .oc-date-range__day {
  color: var(--ant-color-primary, #1890ff);
  font-weight: 600;
}

.oc-date-range__cell.is-selected .oc-date-range__day {
  color: #fff;
  background: var(--ant-color-primary, #1890ff);
}

.oc-date-range__cell.is-selected .oc-date-range__day:hover {
  color: #fff;
  background: var(--ant-color-primary, #1890ff);
}

.oc-date-range__cell.is-disabled .oc-date-range__day {
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
  background: transparent;
}
</style>
