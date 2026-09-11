/**
 * ant-design-vue cloneElement 在 @vue/compat 下合并 props 时可能丢掉/污染 onSelect 等函数。
 * 合并后强制写回 nodeProps 中的函数属性。
 */
import { filterEmpty } from 'ant-design-vue/es/_util/props-util'
import { cloneVNode, isVNode, Comment, Fragment, render as VueRender } from 'vue'
import warning from 'ant-design-vue/es/_util/warning'

function assignProps (target, source) {
  const out = { ...(target || {}) }
  Object.keys(source || {}).forEach((key) => {
    const val = source[key]
    if (val === undefined) return
    out[key] = val
  })
  // 函数属性以 source 为准（compat 合并可能弄丢或变成数组）
  Object.keys(source || {}).forEach((key) => {
    if (typeof source[key] === 'function') {
      out[key] = source[key]
    }
  })
  return out
}

export function cloneElement (vnode, nodeProps = {}, override = true, mergeRef = false) {
  let ele = vnode
  if (Array.isArray(vnode)) {
    ele = filterEmpty(vnode)[0]
  }
  if (!ele) return null
  const node = cloneVNode(ele, nodeProps, mergeRef)
  node.props = override ? assignProps(node.props, nodeProps) : node.props
  warning(typeof node.props.class !== 'object', 'class must be string')
  return node
}

export function cloneVNodes (vnodes, nodeProps = {}, override = true) {
  return vnodes.map(vnode => cloneElement(vnode, nodeProps, override))
}

export function deepCloneElement (vnode, nodeProps = {}, override = true, mergeRef = false) {
  if (Array.isArray(vnode)) {
    return vnode.map(item => deepCloneElement(item, nodeProps, override, mergeRef))
  }
  if (!isVNode(vnode)) return vnode
  const cloned = cloneElement(vnode, nodeProps, override, mergeRef)
  if (Array.isArray(cloned.children)) {
    cloned.children = deepCloneElement(cloned.children)
  }
  return cloned
}

export function triggerVNodeUpdate (vm, attrs, dom) {
  VueRender(cloneVNode(vm, { ...attrs }), dom)
}

const ensureValidVNode = slot => {
  return (slot || []).some(child => {
    if (!isVNode(child)) return true
    if (child.type === Comment) return false
    if (child.type === Fragment && !ensureValidVNode(child.children)) return false
    return true
  }) ? slot : null
}

export function customRenderSlot (slots, name, props, fallback) {
  const slot = slots[name] && slots[name](props)
  if (ensureValidVNode(slot)) return slot
  return fallback && fallback()
}
