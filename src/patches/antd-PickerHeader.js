/**
 * vc-picker Header 补丁：
 * compat 下 onPrev/onNext 等 onXxx 作 props 不可靠，改用非 on 前缀 handler，
 * 并用 mousedown 触发（面板容器会 preventDefault mousedown，部分环境 click 丢）。
 */
import { createVNode as _createVNode, defineComponent } from 'vue'
import { useInjectPanel } from 'ant-design-vue/es/vc-picker/PanelContext.js'

const HIDDEN_STYLE = { visibility: 'hidden' }

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
  // 只用 mousedown：面板容器会 preventDefault(mousedown)，部分环境随后 click 不触发；
  // 若同时绑 click 会连跳两个月。
  return (e) => {
    if (e && e.type === 'click') return
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    handler(e)
  }
}

export default defineComponent({
  compatConfig: { MODE: 3 },
  name: 'Header',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    prevIcon: { type: [String, Object], default: '\u2039' },
    nextIcon: { type: [String, Object], default: '\u203A' },
    superPrevIcon: { type: [String, Object], default: '\u00AB' },
    superNextIcon: { type: [String, Object], default: '\u00BB' },
    // 推荐：非 on 前缀，避免 compat 当监听器吃掉
    prevHandler: { type: [Function, Array], default: undefined },
    nextHandler: { type: [Function, Array], default: undefined },
    superPrevHandler: { type: [Function, Array], default: undefined },
    superNextHandler: { type: [Function, Array], default: undefined },
    // 兼容原 onXxx
    onSuperPrev: { type: [Function, Array], default: undefined },
    onSuperNext: { type: [Function, Array], default: undefined },
    onPrev: { type: [Function, Array], default: undefined },
    onNext: { type: [Function, Array], default: undefined },
  },
  setup (props, { slots, attrs }) {
    const panelContext = useInjectPanel() || {}
    return () => {
      const prefixCls = props.prefixCls
      const onSuperPrev = pickHandler(props, attrs, ['superPrevHandler', 'onSuperPrev'])
      const onSuperNext = pickHandler(props, attrs, ['superNextHandler', 'onSuperNext'])
      const onPrev = pickHandler(props, attrs, ['prevHandler', 'onPrev'])
      const onNext = pickHandler(props, attrs, ['nextHandler', 'onNext'])
      const hidePrevBtn = panelContext.hidePrevBtn
      const hideNextBtn = panelContext.hideNextBtn
      const prevHidden = !!(hidePrevBtn && hidePrevBtn.value)
      const nextHidden = !!(hideNextBtn && hideNextBtn.value)

      const prevTrigger = bindTrigger(onPrev)
      const nextTrigger = bindTrigger(onNext)
      const superPrevTrigger = bindTrigger(onSuperPrev)
      const superNextTrigger = bindTrigger(onSuperNext)

      return _createVNode('div', { class: prefixCls }, [
        onSuperPrev
          ? _createVNode('button', {
            type: 'button',
            tabindex: -1,
            class: `${prefixCls}-super-prev-btn`,
            style: prevHidden ? HIDDEN_STYLE : {},
            onMousedown: superPrevTrigger,
          }, [props.superPrevIcon])
          : null,
        onPrev
          ? _createVNode('button', {
            type: 'button',
            tabindex: -1,
            class: `${prefixCls}-prev-btn`,
            style: prevHidden ? HIDDEN_STYLE : {},
            onMousedown: prevTrigger,
          }, [props.prevIcon])
          : null,
        _createVNode('div', { class: `${prefixCls}-view` }, [
          slots.default ? slots.default() : null,
        ]),
        onNext
          ? _createVNode('button', {
            type: 'button',
            tabindex: -1,
            class: `${prefixCls}-next-btn`,
            style: nextHidden ? HIDDEN_STYLE : {},
            onMousedown: nextTrigger,
          }, [props.nextIcon])
          : null,
        onSuperNext
          ? _createVNode('button', {
            type: 'button',
            tabindex: -1,
            class: `${prefixCls}-super-next-btn`,
            style: nextHidden ? HIDDEN_STYLE : {},
            onMousedown: superNextTrigger,
          }, [props.superNextIcon])
          : null,
      ])
    }
  },
})
