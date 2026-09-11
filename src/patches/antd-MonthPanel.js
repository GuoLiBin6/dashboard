/**
 * vc-picker MonthPanel 补丁：向 MonthHeader 传递非 on 前缀 handler。
 */
import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2'
import { createVNode as _createVNode } from 'vue'
import MonthHeader from 'ant-design-vue/es/vc-picker/panels/MonthPanel/MonthHeader.js'
import MonthBody, { MONTH_COL_COUNT } from 'ant-design-vue/es/vc-picker/panels/MonthPanel/MonthBody.js'
import { createKeydownHandler } from 'ant-design-vue/es/vc-picker/utils/uiUtil.js'
import useMergeProps from 'ant-design-vue/es/vc-picker/hooks/useMergeProps.js'

function MonthPanel (_props) {
  const props = useMergeProps(_props)
  const {
    prefixCls,
    operationRef,
    onViewDateChange,
    generateConfig,
    value,
    viewDate,
    onPanelChange,
    onSelect,
  } = props
  const panelPrefixCls = `${prefixCls}-month-panel`

  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, {
      onLeftRight: diff => {
        onSelect(generateConfig.addMonth(value || viewDate, diff), 'key')
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key')
      },
      onUpDown: diff => {
        onSelect(generateConfig.addMonth(value || viewDate, diff * MONTH_COL_COUNT), 'key')
      },
      onEnter: () => {
        onPanelChange('date', value || viewDate)
      },
    }),
  }

  const onYearChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff)
    if (typeof onViewDateChange === 'function') onViewDateChange(newDate)
    if (typeof onPanelChange === 'function') onPanelChange(null, newDate)
  }

  const prevYear = () => { onYearChange(-1) }
  const nextYear = () => { onYearChange(1) }
  const yearClick = () => {
    if (typeof onPanelChange === 'function') onPanelChange('year', viewDate)
  }

  return _createVNode('div', {
    class: panelPrefixCls,
  }, [
    _createVNode(MonthHeader, _objectSpread(_objectSpread({}, props), {}, {
      prefixCls,
      prevYearHandler: prevYear,
      nextYearHandler: nextYear,
      yearClickHandler: yearClick,
      onPrevYear: prevYear,
      onNextYear: nextYear,
      onYearClick: yearClick,
    }), null),
    _createVNode(MonthBody, _objectSpread(_objectSpread({}, props), {}, {
      prefixCls,
      onSelect: date => {
        if (typeof onSelect === 'function') onSelect(date, 'mouse')
        if (typeof onPanelChange === 'function') onPanelChange('date', date)
      },
    }), null),
  ])
}

MonthPanel.displayName = 'MonthPanel'
MonthPanel.inheritAttrs = false
MonthPanel.compatConfig = { MODE: 3 }
export default MonthPanel
