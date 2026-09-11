/**
 * Vue2 render 函数 data → Vue3 h() props 归一化。
 * 旧代码大量使用 h(tag, { props, attrs, on, scopedSlots }, children)。
 */
import { h as vueH, resolveDynamicComponent, getCurrentInstance } from 'vue'
import { Tooltip as ATooltip } from 'ant-design-vue'

function camelize (str) {
  return String(str || '').replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

function toHandlerKey (event) {
  const e = String(event || '')
  return e ? 'on' + e.charAt(0).toUpperCase() + e.slice(1) : ''
}

function kebabToPascal (name) {
  return String(name || '').replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
}

export function normalizeLegacyData (data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  // 已是 Vue3 扁平形态（无 props/attrs/on/scopedSlots）则尽量原样返回，避免重复处理
  if (!data.props && !data.attrs && !data.on && !data.scopedSlots && !data.domProps) {
    return data
  }
  const out = {}

  if (data.class != null) out.class = data.class
  if (data.style != null) out.style = data.style
  if (data.key != null) out.key = data.key
  if (data.ref != null) out.ref = data.ref

  const assignCamelized = (src) => {
    if (!src || typeof src !== 'object') return
    Object.keys(src).forEach((k) => {
      out[camelize(k)] = src[k]
    })
  }
  assignCamelized(data.attrs)
  assignCamelized(data.props)
  assignCamelized(data.domProps)

  if (data.on && typeof data.on === 'object') {
    Object.keys(data.on).forEach((k) => {
      const handlerKey = toHandlerKey(camelize(k))
      if (handlerKey) out[handlerKey] = data.on[k]
    })
  }

  Object.keys(data).forEach((k) => {
    if (k.startsWith('on') && out[k] == null) out[k] = data[k]
  })

  return out
}

export function normalizeLegacySlots (data) {
  if (!data || typeof data !== 'object') return null
  const s = data.scopedSlots || data.slots
  if (!s || typeof s !== 'object') return null
  const out = {}
  Object.keys(s).forEach((k) => {
    const fn = s[k]
    if (typeof fn === 'function') out[k] = fn
  })
  return Object.keys(out).length ? out : null
}

function resolveAppComponent (type) {
  if (typeof type !== 'string') return type
  // 列表/表头 slot 外 getCurrentInstance 常为空；a-tooltip 必须打到组件对象
  if (type === 'a-tooltip' || type === 'ATooltip') return ATooltip
  const instance = getCurrentInstance()
  if (instance) {
    const resolved = resolveDynamicComponent(type)
    if (resolved && resolved !== type) return resolved
  }
  const comps = (typeof window !== 'undefined' && window.app && window.app._context && window.app._context.components) || {}
  if (comps[type]) return comps[type]
  const pascal = kebabToPascal(type)
  if (comps[pascal]) return comps[pascal]
  return type
}

/** 组件需函数 slot；原生 HTML 标签可直接传 children */
function needsFunctionSlots (type) {
  if (type == null) return false
  if (typeof type === 'object' || typeof type === 'function') return true
  if (typeof type === 'string') {
    // div/span 等：全小写且无连字符
    if (!/[A-Z]/.test(type) && type.indexOf('-') === -1) return false
    return true
  }
  return false
}

function isSlotsObject (children) {
  return (
    children &&
    typeof children === 'object' &&
    !Array.isArray(children) &&
    !(children.__v_isVNode || children.shapeFlag != null) &&
    Object.keys(children).some((k) => typeof children[k] === 'function')
  )
}

function asChildrenOrSlots (type, children) {
  if (children == null) return children
  if (isSlotsObject(children)) return children
  if (!needsFunctionSlots(type)) return children
  return { default: () => children }
}

/**
 * antdv4 Tooltip：自定义组件（如 icon）作 trigger 时 hover/ref 不稳定，统一包 span。
 */
function wrapTooltipTrigger (children) {
  if (children == null) return () => null
  return () => {
    const raw = typeof children === 'function' ? children() : children
    const arr = (Array.isArray(raw) ? raw : [raw]).filter(v => v !== null && v !== undefined && v !== false)
    if (!arr.length) return null
    return vueH('span', {
      class: 'oc-tooltip-trigger',
      style: { display: 'inline-flex', alignItems: 'center', cursor: 'help' },
    }, arr)
  }
}

/**
 * 兼容 Vue2 createElement 签名的 h。
 */
export function legacyH (type, data, children) {
  const resolvedType = resolveAppComponent(type)
  const isTooltip = resolvedType === ATooltip || type === 'a-tooltip' || type === 'ATooltip'

  if (arguments.length === 2 && (Array.isArray(data) || typeof data === 'string' || typeof data === 'number' || data == null)) {
    if (isTooltip) {
      return vueH(ATooltip, null, { default: wrapTooltipTrigger(data) })
    }
    return vueH(resolvedType, null, asChildrenOrSlots(resolvedType, data))
  }

  const slots = normalizeLegacySlots(data)
  const props = normalizeLegacyData(data)

  if (isTooltip) {
    const slotObj = { ...(slots || {}) }
    if (slotObj.default == null) {
      slotObj.default = wrapTooltipTrigger(children)
    } else {
      const originDefault = slotObj.default
      slotObj.default = wrapTooltipTrigger(originDefault)
    }
    return vueH(ATooltip, props || null, slotObj)
  }

  if (slots) {
    const slotObj = { ...slots }
    if (children != null && slotObj.default == null) {
      slotObj.default = () => children
    }
    return vueH(resolvedType, props || null, slotObj)
  }
  return vueH(resolvedType, props || null, asChildrenOrSlots(resolvedType, children))
}

export default legacyH
