/**
 * 横向 a-form / a-form-model 自动统一 label 宽：max(label) + --oc-form-label-gap（默认 50px）。
 * 覆盖 antd labelCol span 百分比。
 * 退出：class="oc-layout-form-off"，或 layout="inline" / "vertical"。
 * 也可手动包 <div class="oc-layout-form">（多个 form 仍各自计算）。
 *
 * 稳定宽度：同一 form 根节点只增不减。v-if 切换（如虚拟机平台 ↔ 远程终端协议）
 * 时，隐藏项离开 DOM 前会先记入历史 max，避免整表 label 列抖动。
 */
const ROOT_CLASS = 'oc-layout-form'
const ROOT_SELECTOR = '.oc-layout-form:not(.oc-layout-form-off), .ant-form.ant-form-horizontal:not(.oc-layout-form-off)'
const WIDTH_VAR = '--oc-form-label-width'
const GAP_VAR = '--oc-form-label-gap'
const DEFAULT_GAP = 50

let started = false
let timer = 0
let measureHost = null
/** @type {WeakMap<Element, number>} 每个表单根节点历史最大 label 文字宽（不含 gap） */
const maxLabelByRoot = new WeakMap()

function isElem (node) {
  return node && node.nodeType === 1
}

function isLayoutRoot (el) {
  if (!isElem(el) || el.classList.contains('oc-layout-form-off')) return false
  if (el.classList.contains('ant-form-inline') || el.classList.contains('ant-form-vertical')) return false
  if (el.classList.contains(ROOT_CLASS)) return true
  return el.classList.contains('ant-form') && el.classList.contains('ant-form-horizontal')
}

function getRoots () {
  const nodes = document.querySelectorAll(ROOT_SELECTOR)
  const roots = []
  for (let i = 0; i < nodes.length; i++) {
    if (isLayoutRoot(nodes[i])) roots.push(nodes[i])
  }
  return roots
}

function findRootFor (el) {
  if (!isElem(el)) return null
  const hit = el.closest(ROOT_SELECTOR)
  return hit && isLayoutRoot(hit) ? hit : null
}

function gapOf (root) {
  const raw = getComputedStyle(root).getPropertyValue(GAP_VAR)
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : DEFAULT_GAP
}

function isNestedFormItem (item) {
  return !!(item.parentElement && item.parentElement.closest('.ant-form-item'))
}

function collectLabels (root) {
  // querySelectorAll 含 display:none / v-show=false，不含已 v-if 销毁的节点
  const nodes = root.querySelectorAll('.ant-form-item-label > label')
  const labels = []
  const rootIsForm = root.classList.contains('ant-form')
  for (let i = 0; i < nodes.length; i++) {
    const label = nodes[i]
    const item = label.closest('.ant-form-item')
    if (!item || isNestedFormItem(item)) continue
    if (!(label.textContent || '').trim()) continue
    const ownerForm = item.closest('.ant-form')
    if (rootIsForm) {
      if (ownerForm !== root) continue
    } else if (ownerForm && ownerForm !== root) {
      continue
    }
    labels.push(label)
  }
  return labels
}

function collectLabelsFromNode (node) {
  if (!isElem(node)) return []
  const labels = []
  if (node.matches && node.matches('.ant-form-item-label > label')) {
    labels.push(node)
  } else if (node.classList && node.classList.contains('ant-form-item-label')) {
    const label = node.querySelector(':scope > label')
    if (label) labels.push(label)
  } else {
    const nodes = node.querySelectorAll ? node.querySelectorAll('.ant-form-item-label > label') : []
    for (let i = 0; i < nodes.length; i++) labels.push(nodes[i])
  }
  return labels.filter((label) => {
    const item = label.closest('.ant-form-item')
    if (!item || isNestedFormItem(item)) return false
    return !!(label.textContent || '').trim()
  })
}

function getMeasureHost () {
  if (measureHost && measureHost.isConnected) return measureHost
  measureHost = document.createElement('div')
  measureHost.className = 'oc-layout-form-measure'
  measureHost.setAttribute('aria-hidden', 'true')
  measureHost.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;'
  document.body.appendChild(measureHost)
  return measureHost
}

/** 一律离屏克隆：display:none / 折叠未展开的 label 也能量到真实文字宽 */
function measureMax (labels, fontSource) {
  if (!labels.length) return 0
  const host = getMeasureHost()
  if (fontSource && isElem(fontSource)) {
    const cs = getComputedStyle(fontSource)
    host.style.fontSize = cs.fontSize
    host.style.fontFamily = cs.fontFamily
    host.style.fontWeight = cs.fontWeight
    host.style.letterSpacing = cs.letterSpacing
  }
  const clones = []
  for (let i = 0; i < labels.length; i++) {
    const col = document.createElement('div')
    col.className = 'ant-form-item-label'
    const clone = labels[i].cloneNode(true)
    clone.style.cssText = 'white-space:nowrap;width:auto;max-width:none;display:inline-flex;'
    col.appendChild(clone)
    host.appendChild(col)
    clones.push(clone)
  }
  let max = 0
  for (let i = 0; i < clones.length; i++) {
    max = Math.max(max, Math.ceil(clones[i].scrollWidth || clones[i].offsetWidth || 0))
  }
  host.textContent = ''
  return max
}

function rememberMax (root, width) {
  if (!root || !(width > 0)) return
  const prev = maxLabelByRoot.get(root) || 0
  if (width > prev) maxLabelByRoot.set(root, width)
}

function applyWidth (root, labelWidth) {
  if (!(labelWidth > 0)) return
  const next = `${labelWidth + gapOf(root)}px`
  if (root.style.getPropertyValue(WIDTH_VAR) !== next) {
    root.style.setProperty(WIDTH_VAR, next)
  }
  const collapses = root.querySelectorAll('.ant-collapse')
  for (let i = 0; i < collapses.length; i++) {
    if (collapses[i].style.getPropertyValue(WIDTH_VAR) !== next) {
      collapses[i].style.setProperty(WIDTH_VAR, next)
    }
  }
}

function syncRoot (root) {
  if (!root.isConnected) return
  const labels = collectLabels(root)
  const measured = measureMax(labels, labels[0] || root)
  rememberMax(root, measured)
  applyWidth(root, maxLabelByRoot.get(root) || measured)
}

function syncAll () {
  const roots = getRoots()
  for (let i = 0; i < roots.length; i++) syncRoot(roots[i])
}

function schedule (immediate) {
  if (immediate) {
    if (timer) {
      window.clearTimeout(timer)
      timer = 0
    }
    window.requestAnimationFrame(syncAll)
    return
  }
  if (timer) return
  timer = window.setTimeout(() => {
    timer = 0
    syncAll()
  }, 32)
}

function nodeHasLayoutForm (node) {
  if (isLayoutRoot(node)) return true
  if (!isElem(node)) return false
  const found = node.querySelector(ROOT_SELECTOR)
  return !!(found && isLayoutRoot(found))
}

function hasItemLabel (node) {
  if (!node) return false
  if (node.nodeType === 3) return !!node.parentElement && !!node.parentElement.closest('.ant-form-item-label')
  if (!isElem(node)) return false
  if (node.classList.contains('ant-form-item-label')) return true
  return !!node.querySelector('.ant-form-item-label')
}

function isCollapseToggle (el) {
  if (!isElem(el)) return false
  return el.classList.contains('ant-collapse-item') ||
    el.classList.contains('ant-collapse-content')
}

/** v-if 卸载前，removedNodes 仍可量宽，写入历史 max，避免随后 sync 变窄 */
function rememberRemovedLabels (mutations) {
  for (let i = 0; i < mutations.length; i++) {
    const m = mutations[i]
    if (m.type !== 'childList' || !m.removedNodes.length) continue
    const root = findRootFor(m.target) || (isLayoutRoot(m.target) ? m.target : null)
    if (!root) continue
    const labels = []
    for (let j = 0; j < m.removedNodes.length; j++) {
      const node = m.removedNodes[j]
      if (!hasItemLabel(node)) continue
      const found = collectLabelsFromNode(node)
      for (let k = 0; k < found.length; k++) labels.push(found[k])
    }
    if (!labels.length) continue
    rememberMax(root, measureMax(labels, root))
  }
}

function mutationRelevant (mutations) {
  const hasRoot = document.querySelector(ROOT_SELECTOR)
  let addedRoot = false
  let innerChange = false
  for (let i = 0; i < mutations.length; i++) {
    const m = mutations[i]
    if (m.type === 'childList') {
      const added = m.addedNodes
      for (let j = 0; j < added.length; j++) {
        if (nodeHasLayoutForm(added[j])) addedRoot = true
        else if (hasRoot && hasItemLabel(added[j])) innerChange = true
      }
      if (!hasRoot && !addedRoot) continue
      const removed = m.removedNodes
      for (let j = 0; j < removed.length; j++) {
        if (hasItemLabel(removed[j])) innerChange = true
      }
      continue
    }
    if (!hasRoot) continue
    if (m.type === 'attributes') {
      if (isCollapseToggle(m.target)) innerChange = true
      // v-show 改 style.display；class 切换也可能影响可见性
      else if (m.attributeName === 'style' || m.attributeName === 'class') {
        if (m.target.closest && m.target.closest('.ant-form-item')) innerChange = true
      }
      continue
    }
    if (m.type === 'characterData') {
      const parent = m.target && m.target.parentElement
      if (parent && parent.closest('.ant-form-item-label') && parent.closest(ROOT_SELECTOR)) innerChange = true
    }
  }
  if (addedRoot) return 'immediate'
  if (innerChange) return 'defer'
  return false
}

function start () {
  if (started || typeof document === 'undefined') return
  started = true
  syncAll()
  const mo = new MutationObserver((mutations) => {
    rememberRemovedLabels(mutations)
    const kind = mutationRelevant(mutations)
    if (kind === 'immediate') schedule(true)
    else if (kind) schedule()
  })
  mo.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
}

function boot () {
  if (typeof window === 'undefined') return
  if (document.body) start()
  else document.addEventListener('DOMContentLoaded', start, { once: true })
}

export default {
  install: boot,
}
