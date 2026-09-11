/**
 * TimeBody 补丁：
 * 1) 从 props/attrs 解析 onSelect（compat 下可能只在 attrs）
 * 2) 用 selectHandler 传给 TimeUnitColumn，避免 onSelect 被当成事件
 */
import _extends from '@babel/runtime/helpers/esm/extends'
import { createVNode as _createVNode, onBeforeUpdate, ref, watchEffect, computed, defineComponent } from 'vue'
import { leftPad } from 'ant-design-vue/es/vc-picker/utils/miscUtil'
import { setTime as utilSetTime } from 'ant-design-vue/es/vc-picker/utils/timeUtil'
import TimeUnitColumn from './antd-TimeUnitColumn.js'

function generateUnits (start, end, step, disabledUnits) {
  const units = []
  for (let i = start; i <= end; i += step) {
    units.push({
      label: leftPad(i, 2),
      value: i,
      disabled: (disabledUnits || []).includes(i),
    })
  }
  return units
}

function resolveFn (val) {
  if (typeof val === 'function') return val
  if (Array.isArray(val)) {
    const fn = val.find((v) => typeof v === 'function')
    return typeof fn === 'function' ? fn : null
  }
  return null
}

const TimeBody = defineComponent({
  compatConfig: { MODE: 3 },
  name: 'TimeBody',
  inheritAttrs: false,
  props: [
    'generateConfig', 'prefixCls', 'operationRef', 'activeColumnIndex', 'value',
    'showHour', 'showMinute', 'showSecond', 'use12Hours', 'hourStep', 'minuteStep', 'secondStep',
    'disabledHours', 'disabledMinutes', 'disabledSeconds', 'disabledTime', 'hideDisabledOptions', 'onSelect',
  ],
  setup (props, { attrs }) {
    const originHour = computed(() => (props.value ? props.generateConfig.getHour(props.value) : -1))
    const isPM = computed(() => {
      if (props.use12Hours) return originHour.value >= 12
      return false
    })
    const hour = computed(() => {
      if (props.use12Hours) return originHour.value % 12
      return originHour.value
    })
    const minute = computed(() => (props.value ? props.generateConfig.getMinute(props.value) : -1))
    const second = computed(() => (props.value ? props.generateConfig.getSecond(props.value) : -1))
    const now = ref(props.generateConfig.getNow())
    const mergedDisabledHours = ref()
    const mergedDisabledMinutes = ref()
    const mergedDisabledSeconds = ref()

    onBeforeUpdate(() => {
      now.value = props.generateConfig.getNow()
    })

    watchEffect(() => {
      if (props.disabledTime) {
        const disabledConfig = props.disabledTime(now)
        ;[mergedDisabledHours.value, mergedDisabledMinutes.value, mergedDisabledSeconds.value] = [
          disabledConfig.disabledHours,
          disabledConfig.disabledMinutes,
          disabledConfig.disabledSeconds,
        ]
      } else {
        ;[mergedDisabledHours.value, mergedDisabledMinutes.value, mergedDisabledSeconds.value] = [
          props.disabledHours,
          props.disabledMinutes,
          props.disabledSeconds,
        ]
      }
    })

    const setTime = (isNewPM, newHour, newMinute, newSecond) => {
      let newDate = props.value || props.generateConfig.getNow()
      const mergedHour = Math.max(0, newHour)
      const mergedMinute = Math.max(0, newMinute)
      const mergedSecond = Math.max(0, newSecond)
      newDate = utilSetTime(
        props.generateConfig,
        newDate,
        !props.use12Hours || !isNewPM ? mergedHour : mergedHour + 12,
        mergedMinute,
        mergedSecond,
      )
      return newDate
    }

    const rawHours = computed(() => generateUnits(0, 23, props.hourStep ?? 1, mergedDisabledHours.value && mergedDisabledHours.value()))
    const AMPMDisabled = computed(() => {
      if (!props.use12Hours) return [false, false]
      const disabled = [true, true]
      rawHours.value.forEach(({ disabled: d, value: hourValue }) => {
        if (d) return
        if (hourValue >= 12) disabled[1] = false
        else disabled[0] = false
      })
      return disabled
    })
    const hours = computed(() => {
      if (!props.use12Hours) return rawHours.value
      return rawHours.value
        .filter(isPM.value ? (h) => h.value >= 12 : (h) => h.value < 12)
        .map((hourMeta) => {
          const hourValue = hourMeta.value % 12
          return _extends({}, hourMeta, {
            label: hourValue === 0 ? '12' : leftPad(hourValue, 2),
            value: hourValue,
          })
        })
    })
    const minutes = computed(() => generateUnits(0, 59, props.minuteStep ?? 1, mergedDisabledMinutes.value && mergedDisabledMinutes.value(originHour.value)))
    const seconds = computed(() => generateUnits(0, 59, props.secondStep ?? 1, mergedDisabledSeconds.value && mergedDisabledSeconds.value(originHour.value, minute.value)))

    return () => {
      const {
        prefixCls,
        operationRef,
        activeColumnIndex,
        showHour,
        showMinute,
        showSecond,
        use12Hours,
        hideDisabledOptions,
      } = props
      const triggerSelect = resolveFn(props.onSelect) || resolveFn(attrs.onSelect) || (() => {})
      const columns = []
      const contentPrefixCls = `${prefixCls}-content`
      const columnPrefixCls = `${prefixCls}-time-panel`

      operationRef.value = {
        onUpDown: (diff) => {
          const column = columns[activeColumnIndex]
          if (!column) return
          const valueIndex = column.units.findIndex((unit) => unit.value === column.value)
          const unitLen = column.units.length
          for (let i = 1; i < unitLen; i += 1) {
            const nextUnit = column.units[(valueIndex + diff * i + unitLen) % unitLen]
            if (nextUnit.disabled !== true) {
              column.onSelect(nextUnit.value)
              break
            }
          }
        },
      }

      function addColumnNode (condition, columnKey, columnValue, units, onColumnSelect) {
        if (condition === false) return
        columns.push({
          node: _createVNode(TimeUnitColumn, {
            key: columnKey,
            prefixCls: columnPrefixCls,
            value: columnValue,
            active: activeColumnIndex === columns.length,
            selectHandler: onColumnSelect,
            units,
            hideDisabledOptions,
          }),
          onSelect: onColumnSelect,
          value: columnValue,
          units,
        })
      }

      addColumnNode(showHour, 'hour', hour.value, hours.value, (num) => {
        triggerSelect(setTime(isPM.value, num, minute.value, second.value), 'mouse')
      })
      addColumnNode(showMinute, 'minute', minute.value, minutes.value, (num) => {
        triggerSelect(setTime(isPM.value, hour.value, num, second.value), 'mouse')
      })
      addColumnNode(showSecond, 'second', second.value, seconds.value, (num) => {
        triggerSelect(setTime(isPM.value, hour.value, minute.value, num), 'mouse')
      })

      let PMIndex = -1
      if (typeof isPM.value === 'boolean') PMIndex = isPM.value ? 1 : 0
      addColumnNode(use12Hours === true, '12hours', PMIndex, [
        { label: 'AM', value: 0, disabled: AMPMDisabled.value[0] },
        { label: 'PM', value: 1, disabled: AMPMDisabled.value[1] },
      ], (num) => {
        triggerSelect(setTime(!!num, hour.value, minute.value, second.value), 'mouse')
      })

      return _createVNode('div', { class: contentPrefixCls }, columns.map(({ node }) => node))
    }
  },
})

export default TimeBody
