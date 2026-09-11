/**
 * getRanges 补丁：保留 ant PickerButton 样式，确保 onClick/onOk 在 compat 下可触发。
 */
import { createVNode as _createVNode } from 'vue'

function resolveFn (val) {
  if (typeof val === 'function') return val
  if (Array.isArray(val)) {
    const fns = val.filter((v) => typeof v === 'function')
    if (!fns.length) return null
    if (fns.length === 1) return fns[0]
    return (...args) => { fns.forEach((fn) => fn(...args)) }
  }
  return null
}

export default function getRanges (_ref) {
  const {
    prefixCls,
    components = {},
    needConfirmButton,
    onNow,
    onOk,
    okDisabled,
    showNow,
    locale,
  } = _ref || {}

  let presetNode
  let okNode

  if (needConfirmButton) {
    const Button = components.button || 'button'
    const nowFn = resolveFn(onNow)
    const okFn = resolveFn(onOk)

    if (nowFn && showNow !== false) {
      presetNode = _createVNode('li', {
        class: `${prefixCls}-now`,
      }, [
        _createVNode('a', {
          class: `${prefixCls}-now-btn`,
          onClick: (e) => {
            e && e.stopPropagation && e.stopPropagation()
            nowFn()
          },
        }, [locale && locale.now]),
      ])
    }

    okNode = _createVNode('li', {
      class: `${prefixCls}-ok`,
    }, [
      _createVNode(Button, {
        size: 'small',
        type: 'primary',
        disabled: !!okDisabled,
        // 同时挂 props / 显式回调，避免 compat 丢 onClick
        onClick: (e) => {
          e && e.stopPropagation && e.stopPropagation()
          if (okDisabled) return
          if (okFn) okFn()
        },
      }, {
        default: () => [locale && locale.ok],
      }),
    ])
  }

  if (!presetNode && !okNode) return null

  return _createVNode('ul', {
    class: `${prefixCls}-ranges`,
  }, [presetNode, okNode])
}
