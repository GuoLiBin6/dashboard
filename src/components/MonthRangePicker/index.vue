<template>
  <div class="oc-month-range" @click="handleClick">
    <a-range-picker
      class="oc-month-range__input"
      :value="dayjsValue"
      picker="month"
      format="YYYY-MM"
      :allowClear="false"
      :open="false"
      :inputReadOnly="true"
      @openChange="showPanel" />
    <div
      v-if="visible"
      ref="panel"
      class="oc-month-range__dropdown"
      @click.stop>
      <div class="oc-month-range__inputs">
        <input v-model="textLeft" type="text" class="oc-month-range__text" />
        <span class="oc-month-range__sep">~</span>
        <input v-model="textRight" type="text" class="oc-month-range__text" />
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
    }
  },
  computed: {
    dayjsValue () {
      if (!this.value || this.value.length !== 2) return [null, null]
      return [toDayjs(this.value[0]), toDayjs(this.value[1])]
    },
    flatMonths () {
      const build = (year) => {
        const list = []
        for (let start = 1; start <= 12; start++) {
          const value = parseInt(this.$moment(`${year}-${start < 10 ? '0' : ''}${start}`).format('YYYYMM'))
          list.push({
            label: this.$t(`common_custom_date.month.${start}`),
            value,
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
    visible (val) {
      if (!val) {
        this.hoverValue = null
        this.changeIndex = 0
        if (this.value && this.value.length === 2 && this.value[0] && this.value[1]) {
          this.selected = [parseInt(this.$moment(this.value[0]).format('YYYYMM')), parseInt(this.$moment(this.value[1]).format('YYYYMM'))]
          this.textLeft = this.$moment(this.value[0]).format('YYYY-MM')
          this.textRight = this.$moment(this.value[1]).format('YYYY-MM')
        } else {
          this.selected = []
          this.textLeft = ''
          this.textRight = ''
        }
      }
    },
  },
  created () {
    this.$bus.$on('app-action', (e) => {
      if (this.visible && this.$refs.panel && e && e.target && !this.$refs.panel.contains(e.target)) {
        this.visible = false
      }
    })
  },
  methods: {
    getShadowShow (value) {
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
    handleYearChange (type, num) {
      this[type] = this[type] + num
    },
    handleMonthClick (e, value) {
      if (this.changeIndex === 0) {
        this.selected = [value, null]
        this.changeIndex = 1
        const left = String(this.selected[0])
        this.textLeft = `${left.slice(0, 4)}-${left.slice(4)}`
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
        this.$nextTick(() => {
          this.$emit('change', this.selectedMoment)
          this.visible = false
        })
      }
      this.hoverValue = null
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    handleMonthOver (value) {
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
  width: 100%;
  min-width: 240px;
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
</style>
