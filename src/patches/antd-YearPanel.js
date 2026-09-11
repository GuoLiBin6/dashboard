/**
 * vc-picker YearPanel 补丁：向 YearHeader 传递非 on 前缀 handler。
 */
import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2'
import { createVNode as _createVNode } from 'vue'
import YearHeader from 'ant-design-vue/es/vc-picker/panels/YearPanel/YearHeader.js'
import YearBody, { YEAR_COL_COUNT } from 'ant-design-vue/es/vc-picker/panels/YearPanel/YearBody.js'
import { createKeydownHandler } from 'ant-design-vue/es/vc-picker/utils/uiUtil.js'
import useMergeProps from 'ant-design-vue/es/vc-picker/hooks/useMergeProps.js'

export const YEAR_DECADE_COUNT = 10

function YearPanel (_props) {
  const props = useMergeProps(_props)
  const {
    prefixCls,
    operationRef,
    onViewDateChange,
    generateConfig,
    value,
    viewDate,
    sourceMode,
    onSelect,
    onPanelChange,
  } = props
  const panelPrefixCls = `${prefixCls}-year-panel`

  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, {
      onLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key')
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff * YEAR_DECADE_COUNT), 'key')
      },
      onUpDown: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff * YEAR_COL_COUNT), 'key')
      },
      onEnter: () => {
        onPanelChange(sourceMode === 'date' ? 'date' : 'month', value || viewDate)
      },
    }),
  }

  const onDecadeChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff * 10)
    if (typeof onViewDateChange === 'function') onViewDateChange(newDate)
    if (typeof onPanelChange === 'function') onPanelChange(null, newDate)
  }

  const prevDecade = () => { onDecadeChange(-1) }
  const nextDecade = () => { onDecadeChange(1) }
  const decadeClick = () => {
    if (typeof onPanelChange === 'function') onPanelChange('decade', viewDate)
  }

  return _createVNode('div', {
    class: panelPrefixCls,
  }, [
    _createVNode(YearHeader, _objectSpread(_objectSpread({}, props), {}, {
      prefixCls,
      prevDecadeHandler: prevDecade,
      nextDecadeHandler: nextDecade,
      decadeClickHandler: decadeClick,
      onPrevDecade: prevDecade,
      onNextDecade: nextDecade,
      onDecadeClick: decadeClick,
    }), null),
    _createVNode(YearBody, _objectSpread(_objectSpread({}, props), {}, {
      prefixCls,
      onSelect: date => {
        if (typeof onPanelChange === 'function') {
          onPanelChange(sourceMode === 'date' ? 'date' : 'month', date)
        }
        if (typeof onSelect === 'function') onSelect(date, 'mouse')
      },
    }), null),
  ])
}

YearPanel.displayName = 'YearPanel'
YearPanel.inheritAttrs = false
YearPanel.compatConfig = { MODE: 3 }
export default YearPanel
