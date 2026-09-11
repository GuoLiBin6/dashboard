/**
 * PickerButton 补丁：用 defineComponent 显式声明 onClick，避免 compat 下事件丢失。
 */
import { createVNode as _createVNode, defineComponent } from 'vue'
import Button from 'ant-design-vue/es/button'

function resolveClick (val) {
  if (typeof val === 'function') return val
  if (Array.isArray(val)) {
    const fns = val.filter((v) => typeof v === 'function')
    if (!fns.length) return null
    if (fns.length === 1) return fns[0]
    return (e) => { fns.forEach((fn) => fn(e)) }
  }
  return null
}

export default defineComponent({
  compatConfig: { MODE: 3 },
  name: 'PickerButton',
  inheritAttrs: false,
  props: {
    disabled: { type: Boolean, default: undefined },
    onClick: { type: [Function, Array], default: undefined },
    size: String,
    type: String,
  },
  setup (props, { attrs, slots }) {
    return () => {
      const onClick = resolveClick(props.onClick) || resolveClick(attrs.onClick)
      return _createVNode(Button, {
        size: 'small',
        type: 'primary',
        ...attrs,
        disabled: props.disabled,
        onClick: onClick || undefined,
      }, slots)
    }
  },
})
