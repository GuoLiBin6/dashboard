/**
 * vc-picker MonthHeader 补丁：用非 on 前缀把年份翻页传给 Header。
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
  name: 'MonthHeader',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    generateConfig: Object,
    locale: Object,
    viewDate: [Object, String, Number],
    prevYearHandler: { type: [Function, Array], default: undefined },
    nextYearHandler: { type: [Function, Array], default: undefined },
    yearClickHandler: { type: [Function, Array], default: undefined },
    onNextYear: { type: [Function, Array], default: undefined },
    onPrevYear: { type: [Function, Array], default: undefined },
    onYearClick: { type: [Function, Array], default: undefined },
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
      const onPrevYear = pickHandler(props, attrs, ['prevYearHandler', 'onPrevYear'])
      const onNextYear = pickHandler(props, attrs, ['nextYearHandler', 'onNextYear'])
      const onYearClick = pickHandler(props, attrs, ['yearClickHandler', 'onYearClick'])
      const yearTrigger = bindTrigger(onYearClick)
      const headerPrefixCls = `${prefixCls}-header`

      return _createVNode(Header, {
        prefixCls: headerPrefixCls,
        prevIcon: props.prevIcon,
        nextIcon: props.nextIcon,
        superPrevIcon: props.superPrevIcon,
        superNextIcon: props.superNextIcon,
        superPrevHandler: onPrevYear || undefined,
        superNextHandler: onNextYear || undefined,
      }, {
        default: () => [
          _createVNode('button', {
            type: 'button',
            class: `${prefixCls}-year-btn`,
            onMousedown: yearTrigger,
          }, [
            formatValue(props.viewDate, {
              locale: props.locale,
              format: props.locale && props.locale.yearFormat,
              generateConfig: props.generateConfig,
            }),
          ]),
        ],
      })
    }
  },
})
