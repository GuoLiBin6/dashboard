/** 列表单元格 Popover 内容区：随内容收缩，max 仅作上限 */
export const LIST_BODY_CELL_POPOVER_STYLE = {
  width: 'fit-content',
  maxWidth: '80vw',
  maxHeight: '60vh',
  overflow: 'auto',
}

/**
 * 按触发点上下可用空间决定 placement，并把 maxHeight 限制在可视区内，避免贴边时撑出页面。
 * @param {HTMLElement} triggerEl
 * @param {{ gap?: number, minHeight?: number, maxHeightRatio?: number }} [options]
 * @returns {{ placement: 'top'|'bottom', maxHeight: string }}
 */
export function resolveListBodyCellPopoverLayout (triggerEl, options = {}) {
  const gap = options.gap != null ? options.gap : 12
  const minH = options.minHeight != null ? options.minHeight : 160
  const maxHeightRatio = options.maxHeightRatio != null ? options.maxHeightRatio : 0.6
  const rect = triggerEl && typeof triggerEl.getBoundingClientRect === 'function'
    ? triggerEl.getBoundingClientRect()
    : { top: 0, bottom: 0 }
  const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - gap)
  const spaceAbove = Math.max(0, rect.top - gap)
  const placement = spaceBelow >= spaceAbove ? 'bottom' : 'top'
  const available = placement === 'bottom' ? spaceBelow : spaceAbove
  const maxHeight = Math.max(minH, Math.min(window.innerHeight * maxHeightRatio, available))
  return {
    placement,
    maxHeight: `${Math.floor(maxHeight)}px`,
  }
}

/** 合并基础样式与布局计算结果（手写 a-popover 可直接用） */
export function getListBodyCellPopoverContentStyle (layout, extra = {}) {
  return {
    ...LIST_BODY_CELL_POPOVER_STYLE,
    ...(layout && layout.maxHeight ? { maxHeight: layout.maxHeight } : null),
    ...extra,
  }
}

export function estimatePopoverTextWidth (text, padding = 28) {
  const s = String(text || '')
  let w = 0
  for (let i = 0; i < s.length; i++) {
    w += s.charCodeAt(i) > 255 ? 14 : 8
  }
  return w + padding
}

/**
 * name + description 两列：按文案估算列宽，避免固定 minWidth 撑开或截断
 */
export function getNameDescPopoverColumns ({
  nameTitle = 'Name',
  descTitle = 'Description',
  rows = [],
  nameField = 'name',
  descField = 'description',
  nameMax = 420,
  descMax = 520,
  nameMin = 140,
  descMin = 160,
} = {}) {
  const list = Array.isArray(rows) ? rows : []
  const nameWidths = list.map(r => estimatePopoverTextWidth(r && r[nameField]))
  const descWidths = list.map(r => estimatePopoverTextWidth((r && r[descField]) || '-'))
  const nameW = Math.min(
    nameMax,
    Math.max(estimatePopoverTextWidth(nameTitle), nameMin, ...(nameWidths.length ? nameWidths : [0])),
  )
  const descW = Math.min(
    descMax,
    Math.max(estimatePopoverTextWidth(descTitle), descMin, ...(descWidths.length ? descWidths : [0])),
  )
  return [
    { field: nameField, title: nameTitle, width: nameW },
    {
      field: descField,
      title: descTitle,
      width: descW,
      formatter: ({ cellValue }) => cellValue || '-',
    },
  ]
}
