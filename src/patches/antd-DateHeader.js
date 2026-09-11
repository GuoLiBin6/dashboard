/**
 * vc-picker DateHeader 补丁：
 * 用非 on 前缀 handler 传翻页/年月切换，避免 compat 丢失；年月按钮用 mousedown+click。
 */
import { createVNode as _createVNode, defineComponent } from 'vue'
import Header from 'ant-design-vue/es/vc-picker/panels/Header.js'
import { useInjectPanel } from 'ant-design-vue/es/vc-picker/PanelContext.js'
import { formatValue } from 'ant-design-vue/es/vc-picker/utils/dateUtil.js'

function resolveHandler (val) {
  if (typeof val === 'function') return val
  if (Array.isArray(val)) {
    const fns = val.filter((v) => typeof v === 'function')
    if (!fns.length) return null
    if (fns.length === 1) return fns[0]
    return (...args) => { fns.forEach((fn) => fn(...args)) }
  }
  return null
}

function pickHandler (props, attrs, names) {
  for (let i = 0; i < names.length; i++) {
    const fn = resolveHandler(props[names[i]]) || resolveHandler(attrs[names[i]])
    if (fn) return fn
  }
  return null
}

function bindTrigger (handler) {
  if (!handler) return undefined
  return (e) => {
    if (e && e.type === 'click') return
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    handler(e)
  }
}

export default defineComponent({
  compatConfig: { MODE: 3 },
  name: 'DateHeader',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    generateConfig: Object,
    locale: Object,
    viewDate: [Object, String, Number],
    value: [Object, String, Number],
    // 推荐非 on 前缀
    prevMonthHandler: { type: [Function, Array], default: undefined },
    nextMonthHandler: { type: [Function, Array], default: undefined },
    prevYearHandler: { type: [Function, Array], default: undefined },
    nextYearHandler: { type: [Function, Array], default: undefined },
    yearClickHandler: { type: [Function, Array], default: undefined },
    monthClickHandler: { type: [Function, Array], default: undefined },
    // 兼容原 onXxx
    onNextMonth: { type: [Function, Array], default: undefined },
    onPrevMonth: { type: [Function, Array], default: undefined },
    onNextYear: { type: [Function, Array], default: undefined },
    onPrevYear: { type: [Function, Array], default: undefined },
    onYearClick: { type: [Function, Array], default: undefined },
    onMonthClick: { type: [Function, Array], default: undefined },
    prevIcon: { type: [String, Object], default: undefined },
    nextIcon: { type: [String, Object], default: undefined },
    superPrevIcon: { type: [String, Object], default: undefined },
    superNextIcon: { type: [String, Object], default: undefined },
  },
  setup (props, { attrs }) {
    const panelContext = useInjectPanel() || {}
    return () => {
      const hideHeader = panelContext.hideHeader
      if (hideHeader && hideHeader.value) return null

      const prefixCls = props.prefixCls
      const generateConfig = props.generateConfig
      const locale = props.locale || {}
      const viewDate = props.viewDate

      const onMonthClick = pickHandler(props, attrs, ['monthClickHandler', 'onMonthClick'])
      const onYearClick = pickHandler(props, attrs, ['yearClickHandler', 'onYearClick'])
      const onPrevMonth = pickHandler(props, attrs, ['prevMonthHandler', 'onPrevMonth'])
      const onNextMonth = pickHandler(props, attrs, ['nextMonthHandler', 'onNextMonth'])
      const onPrevYear = pickHandler(props, attrs, ['prevYearHandler', 'onPrevYear'])
      const onNextYear = pickHandler(props, attrs, ['nextYearHandler', 'onNextYear'])

      const headerPrefixCls = `${prefixCls}-header`
      const monthsLocale = locale.shortMonths ||
        (generateConfig && generateConfig.locale && generateConfig.locale.getShortMonths
          ? generateConfig.locale.getShortMonths(locale.locale)
          : [])
      const month = generateConfig ? generateConfig.getMonth(viewDate) : 0

      const yearTrigger = bindTrigger(onYearClick)
      const monthTrigger = bindTrigger(onMonthClick)

      const yearNode = _createVNode('button', {
        type: 'button',
        key: 'year',
        tabindex: -1,
        class: `${prefixCls}-year-btn`,
        onMousedown: yearTrigger,
      }, [
        formatValue(viewDate, {
          locale,
          format: locale.yearFormat,
          generateConfig,
        }),
      ])

      const monthNode = _createVNode('button', {
        type: 'button',
        key: 'month',
        tabindex: -1,
        class: `${prefixCls}-month-btn`,
        onMousedown: monthTrigger,
      }, [
        locale.monthFormat
          ? formatValue(viewDate, {
            locale,
            format: locale.monthFormat,
            generateConfig,
          })
          : monthsLocale[month],
      ])

      const monthYearNodes = locale.monthBeforeYear ? [monthNode, yearNode] : [yearNode, monthNode]

      return _createVNode(Header, {
        prefixCls: headerPrefixCls,
        prevIcon: props.prevIcon,
        nextIcon: props.nextIcon,
        superPrevIcon: props.superPrevIcon,
        superNextIcon: props.superNextIcon,
        // 非 on 前缀，确保进 Header props
        prevHandler: onPrevMonth || undefined,
        nextHandler: onNextMonth || undefined,
        superPrevHandler: onPrevYear || undefined,
        superNextHandler: onNextYear || undefined,
      }, {
        default: () => monthYearNodes,
      })
    }
  },
})
