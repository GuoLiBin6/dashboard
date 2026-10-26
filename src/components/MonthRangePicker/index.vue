<template>
  <div ref="trigger" class="oc-month-range" :class="{ 'is-disabled': disabled }" @click="handleClick">
    <!-- 自研触发器，避免 a-range-picker 外观与原生双月选择混淆，且 :open=false 在弹窗内偶发无效 -->
    <div class="oc-month-range__input" :class="{ 'is-disabled': disabled, 'is-active': visible, 'is-empty': !displayText }">
      <span class="oc-month-range__value">{{ displayText || placeholder }}</span>
      <span class="oc-month-range__suffix" aria-hidden="true">
        <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor">
          <path d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zm0-448H184V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136z" />
        </svg>
      </span>
    </div>
    <teleport to="body" :disabled="!teleport">
      <div
        v-if="visible"
        ref="panel"
        class="oc-month-range__dropdown"
        :class="{ 'is-teleport': teleport }"
        :style="teleport ? dropdownStyle : null"
        @mousedown.stop
        @click.stop>
        <div class="oc-month-range__inputs">
          <input v-model="textLeft" type="text" readonly class="oc-month-range__text" />
          <span class="oc-month-range__sep">~</span>
          <input v-model="textRight" type="text" readonly class="oc-month-range__text" />
        </div>
        <div class="oc-month-range__panels">
          <div class="oc-month-range__part">
            <div class="oc-month-range__header">
              <a class="oc-month-range__nav oc-month-range__nav--prev" :title="$t('common_custom_date.prev_year')" @click="handleYearChange('currentLeftYear', -1)" />
              <span class="oc-month-range__year">{{ currentLeftYear }}</span>
              <a
                v-if="currentRightYear - currentLeftYear > 1"
                class="oc-month-range__nav oc-month-range__nav--next"
                :title="$t('common_custom_date.next_year')"
                @click="handleYearChange('currentLeftYear', 1)" />
            </div>
            <div class="oc-month-range__body">
              <div
                v-for="item in flatMonths.left"
                :key="`l-${item.value}`"
                class="oc-month-range__cell"
                :class="{
                  'is-selected': selected.includes(item.value) || item.showSelectedShadow,
                  'is-in-range': item.showShadow,
                  'is-disabled': item.disabled,
                }">
                <a
                  class="oc-month-range__month"
                  @click="(e) => handleMonthClick(e, item.value)"
                  @mouseover="handleMonthOver(item.value)">
                  {{ item.label }}
                </a>
              </div>
            </div>
          </div>
          <div class="oc-month-range__part">
            <div class="oc-month-range__header">
              <a
                v-if="currentRightYear - currentLeftYear > 1"
                class="oc-month-range__nav oc-month-range__nav--prev"
                :title="$t('common_custom_date.prev_year')"
                @click="handleYearChange('currentRightYear', -1)" />
              <span class="oc-month-range__year">{{ currentRightYear }}</span>
              <a class="oc-month-range__nav oc-month-range__nav--next" :title="$t('common_custom_date.next_year')" @click="handleYearChange('currentRightYear', 1)" />
            </div>
            <div class="oc-month-range__body">
              <div
                v-for="item in flatMonths.right"
                :key="`r-${item.value}`"
                class="oc-month-range__cell"
                :class="{
                  'is-selected': selected.includes(item.value) || item.showSelectedShadow,
                  'is-in-range': item.showShadow,
                  'is-disabled': item.disabled,
                }">
                <a
                  class="oc-month-range__month"
                  @click="(e) => handleMonthClick(e, item.value)"
                  @mouseover="handleMonthOver(item.value)">
                  {{ item.label }}
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

export default {
  name: 'MonthRangePicker',
  model: {
    prop: 'value',
    event: 'change',
  },
  props: {
    value: Array,
    panelVisible: Boolean,
    disabled: Boolean,
    disabledDate: Function,
    placeholder: {
      type: String,
      default: '',
    },
    // true：选完两端即关；false：保持打开，由外层确认关闭
    closeOnSelect: {
      type: Boolean,
      default: true,
    },
    // true：挂 body（弹窗内防裁切）；嵌在 Popconfirm 内时保持 false
    teleport: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    let currentLeftYear = parseInt(this.$moment().format('YYYY'))
    let currentRightYear = parseInt(this.$moment().add(1, 'year').format('YYYY'))
    let value1 = null
    let value2 = null
    let textLeft = ''
    let textRight = ''
    if (this.value && this.value.length === 2 && this.value[0] && this.value[1]) {
      currentLeftYear = parseInt(this.$moment(this.value[0]).format('YYYY'))
      const rightYear = parseInt(this.$moment(this.value[1]).format('YYYY'))
      currentRightYear = rightYear === currentLeftYear ? rightYear + 1 : rightYear
      value1 = parseInt(this.$moment(this.value[0]).format('YYYYMM'))
      value2 = parseInt(this.$moment(this.value[1]).format('YYYYMM'))
      textLeft = this.$moment(this.value[0]).format('YYYY-MM')
      textRight = this.$moment(this.value[1]).format('YYYY-MM')
    }
    return {
      visible: false,
      currentLeftYear,
      currentRightYear,
      selected: [value1, value2],
      changeIndex: 0,
      hoverValue: null,
      textLeft,
      textRight,
      dropdownStyle: {},
    }
  },
  computed: {
    dayjsValue () {
      if (!this.value || this.value.length !== 2) return [null, null]
      return [toDayjs(this.value[0]), toDayjs(this.value[1])]
    },
    displayText () {
      const [start, end] = this.dayjsValue
      if (start && end) return `${start.format('YYYY-MM')} ~ ${end.format('YYYY-MM')}`
      if (start) return `${start.format('YYYY-MM')} ~`
      return ''
    },
    flatMonths () {
      const build = (year) => {
        const list = []
        for (let start = 1; start <= 12; start++) {
          const value = parseInt(this.$moment(`${year}-${start < 10 ? '0' : ''}${start}`).format('YYYYMM'))
          list.push({
            label: this.$t(`common_custom_date.month.${start}`),
            value,
            disabled: this.isMonthDisabled(value),
            showShadow: this.getShadowShow(value),
            showSelectedShadow: this.getSelectedShadowShow(value),
          })
        }
        return list
      }
      return {
        left: build(this.currentLeftYear),
        right: build(this.currentRightYear),
      }
    },
    selectedMoment () {
      const left = String(this.selected[0] || '')
      const right = String(this.selected[1] || '')
      if (left.length && right.length) {
        return [this.$moment(`${left.slice(0, 4)}-${left.slice(4)}`), this.$moment(`${right.slice(0, 4)}-${right.slice(4)}`)]
      }
      return [null, null]
    },
  },
  watch: {
    panelVisible (val) {
      if (!val) this.visible = false
    },
    value: {
      deep: true,
      handler (val) {
        if (this.visible || this.changeIndex !== 0) return
        this.syncFromValue(val)
      },
    },
    visible (val) {
      this.$emit('openChange', !!val)
      if (!val) {
        this.unbindPositionListeners()
        this.hoverValue = null
        this.changeIndex = 0
        this.syncFromValue(this.value)
      }
    },
  },
  created () {
    this.$bus.$on('app-action', (e) => {
      if (!this.visible || !e || !e.target) return
      const panel = this.$refs.panel
      const trigger = this.$refs.trigger
      if (panel && panel.contains(e.target)) return
      if (trigger && trigger.contains(e.target)) return
      this.visible = false
    })
  },
  beforeUnmount () {
    this.unbindPositionListeners()
  },
  beforeDestroy () {
    this.unbindPositionListeners()
  },
  methods: {
    syncFromValue (val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        this.selected = [parseInt(this.$moment(val[0]).format('YYYYMM')), parseInt(this.$moment(val[1]).format('YYYYMM'))]
        this.textLeft = this.$moment(val[0]).format('YYYY-MM')
        this.textRight = this.$moment(val[1]).format('YYYY-MM')
        this.currentLeftYear = parseInt(this.$moment(val[0]).format('YYYY'))
        const rightYear = parseInt(this.$moment(val[1]).format('YYYY'))
        this.currentRightYear = rightYear === this.currentLeftYear ? rightYear + 1 : rightYear
      } else {
        this.selected = []
        this.textLeft = ''
        this.textRight = ''
      }
    },
    isMonthDisabled (yyyymm) {
      if (typeof this.disabledDate !== 'function') return false
      const s = String(yyyymm)
      const m = this.$moment(`${s.slice(0, 4)}-${s.slice(4)}`, 'YYYY-MM')
      return !!this.disabledDate(m)
    },
    getShadowShow (value) {
      if (this.isMonthDisabled(value)) return false
      if (this.hoverValue && this.selected[0] && !this.selected[1]) {
        return (value > this.selected[0] && value < this.hoverValue) || (value > this.hoverValue && value < this.selected[0])
      }
      if (this.selected[0] && this.selected[1] && value > this.selected[0] && value < this.selected[1]) {
        return true
      }
      if (this.selected[0] && !this.selected[1] && value > this.selected[0]) {
        return true
      }
      return false
    },
    getSelectedShadowShow (value) {
      return !!(this.hoverValue && value === this.hoverValue)
    },
    bindPositionListeners () {
      if (!this.teleport) return
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
      const panelW = 552
      const gap = 4
      let left = rect.left
      let top = rect.bottom + gap
      if (left + panelW > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelW - 8)
      }
      const estH = 300
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
      if (this.disabled) return
      this.changeIndex = 0
      this.hoverValue = null
      this.syncFromValue(this.value)
      this.visible = true
      if (this.teleport) {
        this.$nextTick(() => {
          this.updateDropdownPosition()
          this.bindPositionListeners()
        })
      }
    },
    hiddenPanel () {
      this.visible = false
      this.unbindPositionListeners()
    },
    handleClick (e) {
      if (this.disabled) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      this.showPanel()
      e.preventDefault()
      e.stopPropagation()
    },
    handleYearChange (type, num) {
      this[type] = this[type] + num
    },
    handleMonthClick (e, value) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (this.isMonthDisabled(value)) return
      if (this.changeIndex === 0) {
        this.selected = [value, null]
        this.changeIndex = 1
        const left = String(this.selected[0])
        this.textLeft = `${left.slice(0, 4)}-${left.slice(4)}`
        this.textRight = ''
      } else {
        if (this.selected[0] > value) {
          this.selected = [value, this.selected[0]]
        } else {
          this.selected = [this.selected[0], value]
        }
        const left = String(this.selected[0])
        const right = String(this.selected[1])
        this.textLeft = `${left.slice(0, 4)}-${left.slice(4)}`
        this.textRight = `${right.slice(0, 4)}-${right.slice(4)}`
        this.changeIndex = 0
        this.$emit('change', this.selectedMoment)
        this.$emit('update:value', this.selectedMoment)
        if (this.closeOnSelect) {
          this.$nextTick(() => {
            this.visible = false
          })
        }
      }
      this.hoverValue = null
    },
    handleMonthOver (value) {
      if (this.isMonthDisabled(value)) return
      if (this.selected[0] && this.selected[1]) return
      this.hoverValue = value
    },
  },
}
</script>

<style lang="less" scoped>
.oc-month-range {
  position: relative;
  width: 100%;
}

.oc-month-range__input {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 240px;
  height: 32px;
  padding: 0 11px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover:not(.is-disabled) {
    border-color: var(--ant-color-primary, #1890ff);
  }

  &.is-active {
    border-color: var(--ant-color-primary, #1890ff);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ant-color-primary, #1890ff) 20%, transparent);
  }

  &.is-disabled {
    cursor: not-allowed;
    background: #f5f5f5;
    color: rgba(0, 0, 0, 0.25);
  }
}

.oc-month-range__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  line-height: 30px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.oc-month-range__input.is-empty .oc-month-range__value {
  color: rgba(0, 0, 0, 0.25);
}

.oc-month-range__suffix {
  flex: none;
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.25);
  font-size: 14px;
  line-height: 1;
}

.oc-month-range.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.oc-month-range__dropdown {
  position: absolute;
  left: 0;
  top: calc(100% + 4px);
  z-index: 1050;
  width: 552px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.oc-month-range__dropdown.is-teleport {
  position: fixed;
  left: auto;
  top: auto;
  /* 高于 BaseDialog 默认 1000，避免弹窗内被挡住 */
  z-index: 2000;
}

.oc-month-range__inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.oc-month-range__text {
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

.oc-month-range__sep {
  flex: none;
  color: rgba(0, 0, 0, 0.45);
}

.oc-month-range__panels {
  display: flex;
  width: 100%;
}

.oc-month-range__part {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  box-sizing: border-box;
}

.oc-month-range__part + .oc-month-range__part {
  border-left: 1px solid #f0f0f0;
}

.oc-month-range__header {
  position: relative;
  height: 40px;
  line-height: 40px;
  text-align: center;
  user-select: none;
}

.oc-month-range__year {
  display: inline-block;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.oc-month-range__nav {
  position: absolute;
  top: 0;
  width: 28px;
  height: 40px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;

  &::before,
  &::after {
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

  &:hover::before,
  &:hover::after {
    border-color: rgba(0, 0, 0, 0.65);
  }
}

.oc-month-range__nav--prev {
  left: 4px;

  &::before,
  &::after {
    transform: rotate(-45deg) scale(0.8);
  }

  &::before {
    left: 10px;
  }

  &::after {
    left: 15px;
  }
}

.oc-month-range__nav--next {
  right: 4px;

  &::before,
  &::after {
    transform: rotate(135deg) scale(0.8);
  }

  &::before {
    right: 15px;
  }

  &::after {
    right: 10px;
  }
}

.oc-month-range__body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  height: 208px;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.oc-month-range__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oc-month-range__cell.is-in-range::before {
  position: absolute;
  top: 8px;
  right: 0;
  bottom: 8px;
  left: 0;
  background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, transparent);
  content: '';
}

.oc-month-range__month {
  position: relative;
  z-index: 1;
  display: inline-block;
  min-width: 48px;
  height: 24px;
  padding: 0 8px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 24px;
  text-align: center;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.oc-month-range__month:hover {
  background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, transparent);
  cursor: pointer;
}

.oc-month-range__cell.is-selected .oc-month-range__month {
  color: #fff;
  background: var(--ant-color-primary, #1890ff);
}

.oc-month-range__cell.is-selected .oc-month-range__month:hover {
  color: #fff;
  background: var(--ant-color-primary, #1890ff);
}

.oc-month-range__cell.is-disabled .oc-month-range__month {
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
  background: transparent;
}
</style>
