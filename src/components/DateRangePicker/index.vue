<template>
  <div class="oc-date-range" @click="handleClick">
    <a-range-picker
      class="oc-date-range__input"
      :value="dayjsValue"
      format="YYYY-MM-DD"
      :allowClear="false"
      :open="false"
      :inputReadOnly="true"
      @openChange="showPanel" />
    <div
      v-if="visible"
      ref="panel"
      class="oc-date-range__dropdown"
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
        if (this.visible && this.$refs.panel && e && e.target && !this.$refs.panel.contains(e.target)) {
          this.visible = false
        }
      })
    }
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
    showPanel () {
      this.visible = true
    },
    hiddenPanel () {
      this.visible = false
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
      this.$emit('calendarChange', [a, b])
      this.$nextTick(() => {
        this.$emit('change', [a, b])
        // 保持面板打开，由外层「确定」关闭；与费用筛选交互一致可直接关掉
        this.visible = false
      })
    },
  },
}
</script>

<style lang="less" scoped>
.oc-date-range {
  position: relative;
  width: 100%;
}

.oc-date-range__input {
  width: 100%;
  min-width: 240px;
}

.oc-date-range__dropdown {
  position: absolute;
  left: 0;
  top: calc(100% + 4px);
  z-index: 1050;
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
