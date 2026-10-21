/**
 * 横向 a-form / a-form-model 自动统一 label 宽：max(label) + --oc-form-label-gap（默认 50px）。
 * 覆盖 antd labelCol span 百分比。
 * 退出：class="oc-layout-form-off"，或 layout="inline" / "vertical"。
 * 也可手动包 <div class="oc-layout-form">（多个 form 仍各自计算）。
 *
 * 默认：扫 DOM label 自动量宽；MutationObserver 回调内同步量宽（尽量赶在 paint 前）。
 * 稳定宽度：同一 form 根节点只增不减。v-if 切换时，隐藏项离开 DOM 前会先记入历史 max。
 *
 * 可选指定最长 label（推荐易闪的大表单）：
 *   max-label="已翻译的最长文案"
 * 传入后不再扫其它 label，只按该文案量宽。多条用 | 或换行分隔（取最宽一条）。
 * 例：<a-form-model :max-label="$t('cloudenv.project_mapping_effective_scope')">
 */
const ROOT_CLASS = 'oc-layout-form'
const ROOT_SELECTOR = '.oc-layout-form:not(.oc-layout-form-off), .ant-form.ant-form-horizontal:not(.oc-layout-form-off)'
const WIDTH_VAR = '--oc-form-label-width'
const GAP_VAR = '--oc-form-label-gap'
const MAX_LABEL_ATTR = 'max-label'
const DEFAULT_GAP = 50

let started = false
let timer = 0
let measureHost = null
/** @type {MutationObserver | null} */
let observer = null
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

/** 相对 root：item 与 root 之间是否还有其它 form-item（真嵌套） */
function isNestedFormItem (item, root) {
  if (!item || !item.parentElement) return false
  let parent = item.parentElement
  while (parent && parent !== root) {
    if (parent.classList && parent.classList.contains('ant-form-item')) return true
    parent = parent.parentElement
  }
  // 无 root 时保持旧语义：祖先中任意 form-item 即视为嵌套
  if (!root) {
    return !!(item.parentElement && item.parentElement.closest('.ant-form-item'))
  }
  return false
}

function collectLabels (root) {
  // querySelectorAll 含 display:none / v-show=false，不含已 v-if 销毁的节点
  const nodes = root.querySelectorAll('.ant-form-item-label > label')
  const labels = []
  const rootIsForm = root.classList.contains('ant-form')
  for (let i = 0; i < nodes.length; i++) {
    const label = nodes[i]
    const item = label.closest('.ant-form-item')
    if (!item || !root.contains(item) || isNestedFormItem(item, root)) continue
    if (!(label.textContent || '').trim()) continue
    const ownerForm = item.closest('.ant-form')
    if (rootIsForm) {
      if (ownerForm !== root) continue
    }
    // 非 form 的 oc-layout-form 子区域：量本区域内 label（可位于外层 form 内）
    labels.push(label)
  }
  return labels
}

function collectLabelsFromNode (node, root) {
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
    if (!item || isNestedFormItem(item, root)) return false
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

function applyMeasureFont (host, fontSource) {
  if (!fontSource || !isElem(fontSource)) return
  const cs = getComputedStyle(fontSource)
  host.style.fontSize = cs.fontSize
  host.style.fontFamily = cs.fontFamily
  host.style.fontWeight = cs.fontWeight
  host.style.letterSpacing = cs.letterSpacing
}

/** 一律离屏克隆：display:none / 折叠未展开的 label 也能量到真实文字宽 */
function measureMax (labels, fontSource) {
  if (!labels.length) return 0
  const host = getMeasureHost()
  applyMeasureFont(host, fontSource)
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

/** 离屏量配置文案宽（与 measureMax 口径一致：不含 gap） */
function measureTextList (texts, fontSource) {
  const list = []
  for (let i = 0; i < (texts || []).length; i++) {
    const t = String(texts[i] || '').trim()
    if (t) list.push(t)
  }
  if (!list.length) return 0
  const host = getMeasureHost()
  applyMeasureFont(host, fontSource)
  const clones = []
  for (let i = 0; i < list.length; i++) {
    const col = document.createElement('div')
    col.className = 'ant-form-item-label'
    const label = document.createElement('label')
    label.textContent = list[i]
    label.style.cssText = 'white-space:nowrap;width:auto;max-width:none;display:inline-flex;'
    col.appendChild(label)
    host.appendChild(col)
    clones.push(label)
  }
  let max = 0
  for (let i = 0; i < clones.length; i++) {
    max = Math.max(max, Math.ceil(clones[i].scrollWidth || clones[i].offsetWidth || 0))
  }
  host.textContent = ''
  return max
}

/** max-label：指定最长 label 文案；多条用 | 或换行分隔 */
function configuredLabelWidth (root) {
  if (!root || typeof root.getAttribute !== 'function') return 0
  const raw = root.getAttribute(MAX_LABEL_ATTR)
  if (!raw || !String(raw).trim()) return 0
  const texts = String(raw).split(/[|\n]/)
  return measureTextList(texts, root)
}

function rememberMax (root, width) {
  if (!root || !(width > 0)) return
  const prev = maxLabelByRoot.get(root) || 0
  if (width > prev) maxLabelByRoot.set(root, width)
}

function applyWidth (root, labelWidth) {
  if (!(labelWidth > 0)) return
  const nextPx = labelWidth + gapOf(root)
  const next = `${nextPx}px`
  // 只增不减（相对已写入的 inline 宽）
  const prevPx = parseFloat(root.style.getPropertyValue(WIDTH_VAR))
  if (Number.isFinite(prevPx) && nextPx <= prevPx + 0.5) return
  root.style.setProperty(WIDTH_VAR, next)
  const collapses = root.querySelectorAll('.ant-collapse')
  for (let i = 0; i < collapses.length; i++) {
    if (collapses[i].style.getPropertyValue(WIDTH_VAR) !== next) {
      collapses[i].style.setProperty(WIDTH_VAR, next)
    }
  }
}

function syncRoot (root) {
  if (!root.isConnected) return
  // 传了最长 label：只按该文案量宽，不再扫 DOM
  const configured = configuredLabelWidth(root)
  let width = configured
  if (!(configured > 0)) {
    const labels = collectLabels(root)
    width = measureMax(labels, labels[0] || root)
  }
  rememberMax(root, width)
  applyWidth(root, maxLabelByRoot.get(root) || width)
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
    // 同步测量（Observer 回调内、paint 前）+ 再跟一帧吃掉同 tick 分批挂载
    syncAll()
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
      const found = collectLabelsFromNode(node, root)
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
      else if (m.attributeName === MAX_LABEL_ATTR) {
        if (isLayoutRoot(m.target) || findRootFor(m.target)) innerChange = true
      } else if (m.attributeName === 'style' || m.attributeName === 'class') {
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

function stop () {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (timer) {
    window.clearTimeout(timer)
    timer = 0
  }
  started = false
}

function start () {
  if (started || typeof document === 'undefined') return
  started = true
  syncAll()
  observer = new MutationObserver((mutations) => {
    rememberRemovedLabels(mutations)
    const kind = mutationRelevant(mutations)
    if (kind === 'immediate') schedule(true)
    else if (kind) schedule()
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', MAX_LABEL_ATTR],
  })
}

function boot () {
  if (typeof window === 'undefined') return
  if (document.body) start()
  else document.addEventListener('DOMContentLoaded', start, { once: true })
}

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    stop()
  })
}

export default {
  install: boot,
}
