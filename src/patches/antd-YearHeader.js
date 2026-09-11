/**
 * vc-picker YearHeader 补丁：用非 on 前缀传 decade 翻页。
 */
import { createVNode as _createVNode, createTextVNode as _createTextVNode, defineComponent } from 'vue'
import Header from 'ant-design-vue/es/vc-picker/panels/Header.js'
import { useInjectPanel } from 'ant-design-vue/es/vc-picker/PanelContext.js'

const YEAR_DECADE_COUNT = 10

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
  name: 'YearHeader',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    generateConfig: Object,
    viewDate: [Object, String, Number],
    prevDecadeHandler: { type: [Function, Array], default: undefined },
    nextDecadeHandler: { type: [Function, Array], default: undefined },
    decadeClickHandler: { type: [Function, Array], default: undefined },
    onPrevDecade: { type: [Function, Array], default: undefined },
    onNextDecade: { type: [Function, Array], default: undefined },
    onDecadeClick: { type: [Function, Array], default: undefined },
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
      const onPrevDecade = pickHandler(props, attrs, ['prevDecadeHandler', 'onPrevDecade'])
      const onNextDecade = pickHandler(props, attrs, ['nextDecadeHandler', 'onNextDecade'])
      const onDecadeClick = pickHandler(props, attrs, ['decadeClickHandler', 'onDecadeClick'])
      const decadeTrigger = bindTrigger(onDecadeClick)
      const headerPrefixCls = `${prefixCls}-header`
      const yearNumber = props.generateConfig ? props.generateConfig.getYear(props.viewDate) : 0
      const startYear = Math.floor(yearNumber / YEAR_DECADE_COUNT) * YEAR_DECADE_COUNT
      const endYear = startYear + YEAR_DECADE_COUNT - 1

      return _createVNode(Header, {
        prefixCls: headerPrefixCls,
        prevIcon: props.prevIcon,
        nextIcon: props.nextIcon,
        superPrevIcon: props.superPrevIcon,
        superNextIcon: props.superNextIcon,
        superPrevHandler: onPrevDecade || undefined,
        superNextHandler: onNextDecade || undefined,
      }, {
        default: () => [
          _createVNode('button', {
            type: 'button',
            class: `${prefixCls}-decade-btn`,
            onMousedown: decadeTrigger,
          }, [startYear, _createTextVNode('-'), endYear]),
        ],
      })
    }
  },
})
