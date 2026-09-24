/** 列表单元格 Popover 内容区：随内容收缩，max 仅作上限 */
export const LIST_BODY_CELL_POPOVER_STYLE = {
  width: 'fit-content',
  maxWidth: '80vw',
  maxHeight: '60vh',
  overflow: 'auto',
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
