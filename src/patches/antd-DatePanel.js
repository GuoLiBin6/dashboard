/**
 * vc-picker DatePanel 补丁：
 * 向 DateHeader 传递非 on 前缀 handler，避免 @vue/compat 丢失翻页/年月回调。
 */
import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2'
import _extends from '@babel/runtime/helpers/esm/extends'
import { createVNode as _createVNode } from 'vue'
import DateBody from 'ant-design-vue/es/vc-picker/panels/DatePanel/DateBody.js'
import DateHeader from 'ant-design-vue/es/vc-picker/panels/DatePanel/DateHeader.js'
import { WEEK_DAY_COUNT } from 'ant-design-vue/es/vc-picker/utils/dateUtil.js'
import { createKeydownHandler } from 'ant-design-vue/es/vc-picker/utils/uiUtil.js'
import classNames from 'ant-design-vue/es/_util/classNames.js'
import useMergeProps from 'ant-design-vue/es/vc-picker/hooks/useMergeProps.js'

const DATE_ROW_COUNT = 6

function DatePanel (_props) {
  const props = useMergeProps(_props)
  const {
    prefixCls,
    panelName = 'date',
    keyboardConfig,
    active,
    operationRef,
    generateConfig,
    value,
    viewDate,
    onViewDateChange,
    onPanelChange,
    onSelect,
  } = props
  const panelPrefixCls = `${prefixCls}-${panelName}-panel`

  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, _extends({
      onLeftRight: diff => {
        onSelect(generateConfig.addDate(value || viewDate, diff), 'key')
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key')
      },
      onUpDown: diff => {
        onSelect(generateConfig.addDate(value || viewDate, diff * WEEK_DAY_COUNT), 'key')
      },
      onPageUpDown: diff => {
        onSelect(generateConfig.addMonth(value || viewDate, diff), 'key')
      },
    }, keyboardConfig)),
  }

  const onYearChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff)
    if (typeof onViewDateChange === 'function') onViewDateChange(newDate)
    if (typeof onPanelChange === 'function') onPanelChange(null, newDate)
  }
  const onMonthChange = diff => {
    const newDate = generateConfig.addMonth(viewDate, diff)
    if (typeof onViewDateChange === 'function') onViewDateChange(newDate)
    if (typeof onPanelChange === 'function') onPanelChange(null, newDate)
  }

  const prevYear = () => { onYearChange(-1) }
  const nextYear = () => { onYearChange(1) }
  const prevMonth = () => { onMonthChange(-1) }
  const nextMonth = () => { onMonthChange(1) }
  const monthClick = () => {
    if (typeof onPanelChange === 'function') onPanelChange('month', viewDate)
  }
  const yearClick = () => {
    if (typeof onPanelChange === 'function') onPanelChange('year', viewDate)
  }

  return _createVNode('div', {
    class: classNames(panelPrefixCls, {
      [`${panelPrefixCls}-active`]: active,
    }),
  }, [
    _createVNode(DateHeader, _objectSpread(_objectSpread({}, props), {}, {
      prefixCls,
      value,
      viewDate,
      prevYearHandler: prevYear,
      nextYearHandler: nextYear,
      prevMonthHandler: prevMonth,
      nextMonthHandler: nextMonth,
      monthClickHandler: monthClick,
      yearClickHandler: yearClick,
      // 双写兼容
      onPrevYear: prevYear,
      onNextYear: nextYear,
      onPrevMonth: prevMonth,
      onNextMonth: nextMonth,
      onMonthClick: monthClick,
      onYearClick: yearClick,
    }), null),
    _createVNode(DateBody, _objectSpread(_objectSpread({}, props), {}, {
      onSelect: date => {
        if (typeof onSelect === 'function') onSelect(date, 'mouse')
      },
      prefixCls,
      value,
      viewDate,
      rowCount: DATE_ROW_COUNT,
    }), null),
  ])
}

DatePanel.displayName = 'DatePanel'
DatePanel.inheritAttrs = false
DatePanel.compatConfig = { MODE: 3 }
export default DatePanel
