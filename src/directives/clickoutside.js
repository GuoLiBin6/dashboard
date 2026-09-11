import Vue from 'vue'
import { on } from '@/utils/dom'

const nodeList = []
const ctx = '@@clickoutsideContext'

let startClick
let seed = 0

!Vue.prototype.$isServer && on(document, 'mousedown', e => (startClick = e))

!Vue.prototype.$isServer && on(document, 'mouseup', e => {
  nodeList.forEach(node => node[ctx].documentHandler(e, startClick))
})

function pathOf (evt) {
  if (!evt) return []
  if (typeof evt.composedPath === 'function') {
    try {
      return evt.composedPath() || []
    } catch (e) { /* ignore */ }
  }
  return []
}

function resolveTarget (target) {
  if (!target) return null
  // 文本节点没有 closest
  return target.nodeType === 3 ? target.parentElement : target
}

function isInIgnoredPopup (target, evt) {
  const el = resolveTarget(target)
  const nodes = pathOf(evt)
  if (el && !nodes.includes(el)) nodes.unshift(el)
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (!n || !n.classList) continue
    if (
      n.classList.contains('ant-picker-dropdown') ||
      n.classList.contains('ant-picker-panel-container') ||
      n.classList.contains('ant-picker-panel') ||
      n.classList.contains('ant-select-dropdown') ||
      n.classList.contains('ant-cascader-dropdown') ||
      n.classList.contains('ant-modal-wrap') ||
      n.classList.contains('ant-popover') ||
      n.classList.contains('auto-completer-portal')
    ) return true
  }
  if (el && el.closest) {
    return !!(
      el.closest('.ant-picker-dropdown') ||
      el.closest('.ant-picker-panel-container') ||
      el.closest('.ant-picker-panel') ||
      el.closest('.ant-select-dropdown') ||
      el.closest('.ant-cascader-dropdown') ||
      el.closest('.ant-modal-wrap') ||
      el.closest('.ant-popover') ||
      el.closest('.auto-completer-portal')
    )
  }
  return false
}

function createDocumentHandler (el, binding, vnode) {
  return function (mouseup = {}, mousedown = {}) {
    // Vue 3 使用 binding.instance；@vue/compat 下仍可能有 vnode.context
    const instance = binding.instance || (vnode && vnode.context)
    if (!instance ||
      !mouseup.target ||
      !mousedown.target ||
      el.contains(mouseup.target) ||
      el.contains(mousedown.target) ||
      el === mouseup.target ||
      isInIgnoredPopup(mouseup.target, mouseup) ||
      isInIgnoredPopup(mousedown.target, mousedown) ||
      (instance.popperElm &&
      (instance.popperElm.contains(mouseup.target) ||
      instance.popperElm.contains(mousedown.target)))) return

    if (binding.expression &&
      el[ctx].methodName &&
      instance[el[ctx].methodName]) {
      instance[el[ctx].methodName]()
    } else {
      el[ctx].bindingFn && el[ctx].bindingFn()
    }
  }
}

function bind (el, binding, vnode) {
  nodeList.push(el)
  const id = seed++
  el[ctx] = {
    id,
    documentHandler: createDocumentHandler(el, binding, vnode),
    methodName: binding.expression,
    bindingFn: binding.value,
  }
}

function update (el, binding, vnode) {
  el[ctx].documentHandler = createDocumentHandler(el, binding, vnode)
  el[ctx].methodName = binding.expression
  el[ctx].bindingFn = binding.value
}

function unbind (el) {
  const len = nodeList.length
  for (let i = 0; i < len; i++) {
    if (nodeList[i][ctx].id === el[ctx].id) {
      nodeList.splice(i, 1)
      break
    }
  }
  delete el[ctx]
}

/**
 * v-clickoutside
 * @desc 点击元素外面才会触发的事件
 * @example
 * ```vue
 * <div v-clickoutside="handleClose">
 * ```
 */
export default {
  // Vue2 / @vue/compat
  bind,
  update,
  unbind,
  // Vue3
  beforeMount: bind,
  updated: update,
  unmounted: unbind,
}
