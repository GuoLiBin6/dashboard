let _xidCounter = 0

export function ensureRowXID (row) {
  if (!row || typeof row !== 'object') return row
  if (row._XID == null) {
    row._XID = `row_${++_xidCounter}`
  }
  return row
}

export function withColumnProperty (col) {
  if (!col) return col
  const property = col.property || col.field
  return { ...col, property, field: col.field || col.property }
}

export function flattenLeafColumns (columns = []) {
  const leaf = []
  columns.forEach((col) => {
    if (!col || col.visible === false) return
    if (col.children && col.children.length) {
      col.children.forEach((child) => {
        if (child && child.visible !== false) leaf.push(withColumnProperty(child))
      })
    } else {
      leaf.push(withColumnProperty(col))
    }
  })
  return leaf
}

export function buildHeaderRows (columns = []) {
  const visible = (columns || []).filter(col => col && col.visible !== false)
  const hasChildren = visible.some(col => col.children && col.children.length)
  if (!hasChildren) {
    return {
      headerRows: [visible.map(col => ({ col: withColumnProperty(col), rowspan: 1, colspan: 1 }))],
      leafColumns: flattenLeafColumns(visible),
    }
  }
  const row1 = []
  const row2 = []
  const leafColumns = []
  visible.forEach((col) => {
    if (col.children && col.children.length) {
      row1.push({ col: withColumnProperty(col), rowspan: 1, colspan: col.children.length })
      col.children.forEach((child) => {
        if (child && child.visible !== false) {
          const leaf = withColumnProperty(child)
          leafColumns.push(leaf)
          row2.push({ col: leaf, rowspan: 1, colspan: 1 })
        }
      })
    } else {
      const leaf = withColumnProperty(col)
      row1.push({ col: leaf, rowspan: 2, colspan: 1 })
      leafColumns.push(leaf)
    }
  })
  return { headerRows: [row1, row2], leafColumns }
}

export function buildVisibleRows (data, treeConfig, expandedMap, rowKeyOf) {
  const list = Array.isArray(data) ? data : []
  if (!treeConfig) {
    return list.map((row, rowIndex) => ({
      row,
      rowIndex,
      flatIndex: rowIndex,
      level: 0,
      hasChildren: false,
    }))
  }
  const childrenField = treeConfig.children || 'children'
  const result = []
  const walk = (nodes, level) => {
    if (!Array.isArray(nodes)) return
    nodes.forEach((row) => {
      ensureRowXID(row)
      const children = row[childrenField]
      const hasChildren = Array.isArray(children) && children.length > 0
      const id = rowKeyOf(row)
      const expanded = !hasChildren || expandedMap[id] !== false
      result.push({
        row,
        rowIndex: result.length,
        flatIndex: result.length,
        level,
        hasChildren,
        expanded,
      })
      if (hasChildren && expanded) walk(children, level + 1)
    })
  }
  walk(list, 0)
  return result
}

export function computeSpanMap (rows, columns, spanMethod) {
  const map = Object.create(null)
  if (typeof spanMethod !== 'function') return map
  const visibleData = rows.map(item => item.row)
  rows.forEach((item, rowIndex) => {
    columns.forEach((col, colIndex) => {
      const column = withColumnProperty(col)
      const ret = spanMethod({
        row: item.row,
        rowIndex,
        $rowIndex: rowIndex,
        column,
        visibleData,
        data: visibleData,
      }) || {}
      const rowspan = ret.rowspan == null ? 1 : ret.rowspan
      const colspan = ret.colspan == null ? 1 : ret.colspan
      map[`${rowIndex}-${colIndex}`] = { rowspan, colspan }
    })
  })
  return map
}

export function shouldRenderSpanCell (map, rowIndex, colIndex) {
  const span = map[`${rowIndex}-${colIndex}`]
  if (!span) return true
  return !(span.rowspan === 0 && span.colspan === 0)
}

export function getSpanCell (map, rowIndex, colIndex) {
  const span = map[`${rowIndex}-${colIndex}`]
  if (!span) return { rowspan: 1, colspan: 1 }
  return span
}
