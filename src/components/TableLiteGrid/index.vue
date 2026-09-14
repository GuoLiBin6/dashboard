<template>
  <div
    class="table-lite-grid"
    :class="{
      'is-bordered': bordered,
      'is-border': border,
      'is-mini': size === 'mini',
      'is-hover-row': highlightHoverRow,
      'is-loading': loading,
    }">
    <div
      ref="scroll"
      class="table-lite-grid__scroll"
      :style="scrollStyle">
      <table class="table-lite-grid__table" :style="tableStyle">
        <colgroup>
          <col
            v-for="col in bodyColumns"
            :key="'col-' + colKey(col)"
            :style="colGroupStyle(col)" />
        </colgroup>
        <thead v-if="showHeader">
          <tr v-for="(headerRow, hIdx) in headerMatrix" :key="'h-' + hIdx">
            <th
              v-for="(cell, cIdx) in headerRow"
              :key="'hc-' + hIdx + '-' + cIdx"
              :rowspan="cell.rowspan"
              :colspan="cell.colspan"
              :class="thClass(cell.col)"
              :style="thStyle(cell.col)"
              @click="onHeaderClick(cell.col)">
              <div class="table-lite-grid__th-inner">
                <template v-if="cell.col.type === 'checkbox'">
                  <a-checkbox
                    :checked="isAllChecked"
                    :indeterminate="isIndeterminate"
                    @click.stop
                    @update:checked="toggleCheckAll" />
                </template>
                <template v-else-if="cell.col.type === 'radio' || cell.col.type === 'expand' || cell.col.type === 'seq'" />
                <template v-else-if="cell.col.slots && cell.col.slots.header">
                  <v-node-render :render-fn="() => renderHeader(cell.col)" />
                </template>
                <template v-else>
                  <span class="table-lite-grid__th-title">{{ cell.col.title }}</span>
                  <span v-if="cell.col.sortable" class="table-lite-grid__sort" :class="sortClass(cell.col)">
                    <i class="table-lite-grid__sort-asc" />
                    <i class="table-lite-grid__sort-desc" />
                  </span>
                </template>
              </div>
              <span
                v-if="canResize(cell.col)"
                class="table-lite-grid__resizer"
                @click.stop
                @mousedown.stop.prevent="onResizeStart($event, cell.col)" />
            </th>
          </tr>
        </thead>
        <tbody class="table-lite-grid__body">
          <tr v-if="showEmptyRow">
            <td :colspan="bodyColumns.length" class="table-lite-grid__empty">
              <!-- loading 时用占位高度，刷新态由蒙层展示，避免把数据挤下去 -->
              <div v-if="loading" class="table-lite-grid__empty-placeholder" />
              <slot v-else name="empty">
                <loader :loading="false" />
                <span v-if="emptyText">{{ emptyText }}</span>
              </slot>
            </td>
          </tr>
          <template v-for="(rowItem, rowIndex) in visibleRowItems" :key="rowKeyOf(rowItem.row, rowIndex)">
            <tr
              :class="rowClass(rowItem.row)"
              :data-row-id="rowKeyOf(rowItem.row, rowIndex)"
              @click="onRowClick(rowItem.row, rowIndex)">
              <template v-for="(col, colIndex) in bodyColumns" :key="colKey(col) + '-' + rowIndex">
                <td
                  v-if="shouldRenderCell(rowIndex, colIndex)"
                  :rowspan="cellSpan(rowIndex, colIndex).rowspan"
                  :colspan="cellSpan(rowIndex, colIndex).colspan"
                  :class="bodyTdClass(col, rowItem.row, rowIndex)"
                  :style="bodyTdStyle(col, rowItem.row, rowIndex)"
                  @click="onCellClick(rowItem.row, col, rowIndex)">
                  <template v-if="col.type === 'checkbox'">
                    <a-checkbox
                      :checked="isRowChecked(rowItem.row)"
                      @click.stop
                      @update:checked="(v) => toggleRowCheck(rowItem.row, v)" />
                  </template>
                  <template v-else-if="col.type === 'radio'">
                    <a-radio
                      :checked="isRadioSelected(rowItem.row)"
                      :disabled="!canSelectRadio(rowItem.row)"
                      @click.stop
                      @update:checked="() => onRadio(rowItem.row)" />
                  </template>
                  <template v-else-if="col.type === 'expand'">
                    <span
                      class="table-lite-grid__expand-btn"
                      :class="{ 'is-open': isExpanded(rowItem.row) }"
                      @click.stop="toggleExpand(rowItem.row)">
                      ▸
                    </span>
                  </template>
                  <template v-else-if="col.type === 'seq'">
                    {{ rowIndex + 1 }}
                  </template>
                  <template v-else>
                    <div
                      v-if="isTreeColumn(col, colIndex)"
                      class="table-lite-grid__tree-cell"
                      :style="{ paddingLeft: `${rowItem.level * 18}px` }">
                      <span
                        v-if="rowItem.hasChildren"
                        class="table-lite-grid__tree-btn"
                        :class="{ 'is-open': rowItem.expanded }"
                        @click.stop="toggleTreeRow(rowItem.row)">
                        ▸
                      </span>
                      <span v-else class="table-lite-grid__tree-placeholder" />
                      <div class="table-lite-grid__tree-content">
                        <v-node-render :render-fn="() => renderBodyCell(col, rowItem.row, rowIndex)" />
                      </div>
                    </div>
                    <v-node-render v-else :render-fn="() => renderBodyCell(col, rowItem.row, rowIndex)" />
                  </template>
                </td>
              </template>
            </tr>
            <tr v-if="isExpanded(rowItem.row)" :key="'exp-' + rowKeyOf(rowItem.row, rowIndex)" class="table-lite-grid__expand-row">
              <td :colspan="bodyColumns.length" class="table-lite-grid__expand-cell">
                <v-node-render :render-fn="() => renderExpand(rowItem.row, rowIndex)" />
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot v-if="showFooterBlock">
          <tr
            v-for="(footerRow, fIdx) in footerRows"
            :key="'f-' + fIdx"
            class="table-lite-grid__footer-row">
            <td
              v-for="(cell, cIdx) in footerRow"
              :key="'fc-' + fIdx + '-' + cIdx"
              :class="footerTdClass(bodyColumns[cIdx], fIdx)"
              :style="footerTdStyle(bodyColumns[cIdx], fIdx)"
              @click="onFooterCellClick(bodyColumns[cIdx], fIdx)">
              {{ cell }}
            </td>
          </tr>
        </tfoot>
      </table>
      <div v-if="loading" class="table-lite-grid__loading-mask">
        <div class="table-lite-grid__loading-inner">
          <div class="table-lite-grid__spinner" aria-hidden="true">
            <i v-for="n in 12" :key="n" :style="spinnerBarStyle(n)" />
          </div>
          <div class="table-lite-grid__loading-text">{{ $t('common.loding') }}</div>
        </div>
      </div>
    </div>
    <div v-if="pagerConfig" class="table-lite-grid__pager">
      <a-pagination
        size="small"
        :current="pagerConfig.currentPage || 1"
        :page-size="pagerConfig.pageSize || 10"
        :total="pagerConfig.total || 0"
        :show-size-changer="!!pagerConfig.pageSizes"
        :page-size-options="pagerSizeOptions"
        show-quick-jumper
        :show-total="showPagerTotal"
        @change="onPagerCurrentChange"
        @showSizeChange="onPagerSizeChange" />
    </div>
  </div>
</template>

<script>
import { defineComponent, h } from 'vue'
import Loader from '@/components/PageList/Loader.vue'
import legacyH from '@/utils/legacyCreateElement'
import { runWithCreateElement, wrapVxeColumnSlots } from '@/utils/common/tableColumn'
import {
  buildHeaderRows,
  buildVisibleRows,
  computeSpanMap,
  ensureRowXID,
  getSpanCell,
  shouldRenderSpanCell,
  withColumnProperty,
} from '@/utils/common/tableLiteGrid'

const COL_MIN_WIDTH = 40
const SELECT_COL_WIDTH = 35
const EXPAND_COL_WIDTH = 40
const SEQ_COL_WIDTH = 60

const VNodeRender = defineComponent({
  name: 'TableLiteGridVNodeRender',
  props: {
    renderFn: { type: Function, default: null },
  },
  render () {
    const n = typeof this.renderFn === 'function' ? this.renderFn() : null
    if (n == null || n === '' || n === false) return null
    if (Array.isArray(n)) return n
    return n
  },
})

export default {
  name: 'TableLiteGrid',
  components: {
    Loader,
    VNodeRender,
  },
  props: {
    columns: {
      type: Array,
      required: true,
      default: () => [],
    },
    data: {
      type: Array,
      default: () => [],
    },
    loading: Boolean,
    // 外框（不含列竖线），默认开启；PageList 等列表依赖此外框
    bordered: {
      type: Boolean,
      default: true,
    },
    // 列竖线，默认关闭；授权使用情况等表需显式传 border
    border: {
      type: Boolean,
      default: false,
    },
    resizable: {
      type: Boolean,
      default: true,
    },
    columnConfig: {
      type: Object,
      default: () => ({}),
    },
    rowConfig: {
      type: Object,
      default: () => ({}),
    },
    rowKey: {
      type: String,
      default: '',
    },
    maxHeight: {
      type: [Number, String],
      default: null,
    },
    height: {
      type: [Number, String],
      default: null,
    },
    minHeight: {
      type: [Number, String],
      default: null,
    },
    emptyText: String,
    selectionType: {
      type: String,
      default: null,
    },
    radioConfig: Object,
    checkboxConfig: Object,
    expandConfig: Object,
    treeConfig: Object,
    editConfig: Object,
    sortConfig: Object,
    spanMethod: Function,
    footerMethod: Function,
    cellStyle: Function,
    cellClassName: Function,
    footerCellStyle: Function,
    footerCellClassName: Function,
    pagerConfig: Object,
    showFooter: {
      type: [Boolean, Number],
      default: false,
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    keepSource: Boolean,
    highlightHoverRow: {
      type: Boolean,
      default: false,
    },
    showOverflow: {
      type: [Boolean, String],
      default: 'ellipsis',
    },
    size: {
      type: String,
      default: 'medium',
    },
    showHeaderOverflow: {
      type: [Boolean, String],
      default: null,
    },
  },
  emits: [
    'cell-click',
    'row-click',
    'sort-change',
    'checkbox-change',
    'checkbox-all',
    'radio-change',
    'selection-change',
    'toggle-row-expand',
    'edit-closed',
    'edit-actived',
    'page-change',
    'footer-cell-click',
    'column-resizable-change',
  ],
  data () {
    return {
      colWidths: {},
      viewportWidth: 0,
      _resizeState: null,
      sortProperty: '',
      sortOrder: null,
      sortedDisplayData: null,
      checkedMap: Object.create(null),
      currentRow: null,
      expandedMap: Object.create(null),
      treeExpandedMap: Object.create(null),
      editRow: null,
      editActiveField: '',
      sourceMap: Object.create(null),
    }
  },
  computed: {
    effectiveRowKey () {
      return this.rowKey || this.rowConfig.keyField || 'id'
    },
    effectiveResizable () {
      if (this.columnConfig && this.columnConfig.resizable === false) return false
      return this.resizable
    },
    useEllipsis () {
      if (this.showOverflow === false) return false
      return this.showOverflow === 'ellipsis' || this.showOverflow === true || this.showOverflow === 'title'
    },
    normalizedColumns () {
      return wrapVxeColumnSlots(this.columns || [], legacyH)
        .filter(col => col && col.visible !== false)
        .map(withColumnProperty)
    },
    headerStructure () {
      return buildHeaderRows(this.normalizedColumns)
    },
    headerMatrix () {
      return this.headerStructure.headerRows
    },
    leafColumns () {
      return this.headerStructure.leafColumns
    },
    hasColumnType () {
      return new Set(this.leafColumns.map(c => c && c.type).filter(Boolean))
    },
    resolvedSelectionType () {
      if (this.selectionType) return this.selectionType
      if (this.hasColumnType.has('checkbox') || this.checkboxConfig) return this.hasColumnType.has('checkbox') ? null : 'checkbox'
      if (this.hasColumnType.has('radio') || this.radioConfig) return this.hasColumnType.has('radio') ? null : 'radio'
      return null
    },
    bodyColumns () {
      let cols = [...this.leafColumns]
      if (this.expandConfig && !this.hasColumnType.has('expand')) {
        cols = [{ type: 'expand', width: EXPAND_COL_WIDTH, resizable: false }, ...cols]
      }
      const sel = this.resolvedSelectionType
      if (sel === 'checkbox' && !this.hasColumnType.has('checkbox')) {
        cols = [{ type: 'checkbox', width: SELECT_COL_WIDTH, resizable: false }, ...cols]
      } else if (sel === 'radio' && !this.hasColumnType.has('radio')) {
        cols = [{ type: 'radio', width: SELECT_COL_WIDTH, resizable: false }, ...cols]
      }
      return cols.map(withColumnProperty)
    },
    /** 各列声明/拖拽后的基准宽度 */
    colBaseWidths () {
      return this.bodyColumns.map(col => this.resolveColMinWidth(col))
    },
    colBaseSum () {
      return this.colBaseWidths.reduce((a, b) => a + b, 0)
    },
    /** 基准宽总和 < 容器：有剩余宽度，按比例分摊铺满 */
    isColFillMode () {
      return this.viewportWidth > 0 && this.colBaseSum > 0 && this.colBaseSum < this.viewportWidth
    },
    /** 实际用于渲染的列宽（填充分摊或原样） */
    colDisplayWidths () {
      const bases = this.colBaseWidths
      const sum = this.colBaseSum
      const vw = this.viewportWidth
      if (!bases.length) return []
      if (!vw || sum <= 0 || sum >= vw) return bases.slice()
      const raw = bases.map(b => (b / sum) * vw)
      const floors = raw.map(v => Math.floor(v))
      const rest = vw - floors.reduce((a, b) => a + b, 0)
      const order = raw
        .map((v, i) => ({ i, f: v - floors[i] }))
        .sort((a, b) => b.f - a.f)
      const result = floors.slice()
      for (let k = 0; k < rest; k++) {
        result[order[k % order.length].i] += 1
      }
      return result
    },
    colDisplayWidthMap () {
      const map = Object.create(null)
      this.bodyColumns.forEach((col, i) => {
        map[this.colKey(col)] = this.colDisplayWidths[i]
      })
      return map
    },
    tableData () {
      return Array.isArray(this.data) ? this.data : []
    },
    displayData () {
      if (this.sortedDisplayData) return this.sortedDisplayData
      return this.tableData
    },
    visibleRowItems () {
      return buildVisibleRows(
        this.displayData,
        this.treeConfig,
        this.treeExpandedMap,
        row => this.rowKeyOf(row),
      )
    },
    spanMap () {
      return computeSpanMap(this.visibleRowItems, this.bodyColumns, this.spanMethod)
    },
    showEmptyRow () {
      // loading 不再插入空行挤数据；无数据时才显示 empty / 占位
      return !this.visibleRowItems.length
    },
    tableStyle () {
      const sum = this.colBaseSum
      // 有剩余宽度：铺满容器，由各列按比例分摊；否则拖多宽就多宽（可横向滚动）
      if (this.isColFillMode) {
        return {
          width: '100%',
          minWidth: '100%',
        }
      }
      const width = Math.max(sum, 100)
      return {
        width: `${width}px`,
        minWidth: `${width}px`,
      }
    },
    scrollStyle () {
      const style = {}
      const mh = this.maxHeight != null && this.maxHeight !== '' ? this.maxHeight : null
      const h = this.height != null && this.height !== '' ? this.height : null
      const minh = this.minHeight != null && this.minHeight !== '' ? this.minHeight : null
      if (mh != null) style.maxHeight = typeof mh === 'number' ? `${mh}px` : mh
      if (h != null) style.height = typeof h === 'number' ? `${h}px` : h
      if (minh != null) style.minHeight = typeof minh === 'number' ? `${minh}px` : minh
      return style
    },
    isAllChecked () {
      if (!this.visibleRowItems.length) return false
      return this.visibleRowItems.every(item => this.isRowChecked(item.row))
    },
    isIndeterminate () {
      if (!this.visibleRowItems.length) return false
      const n = this.visibleRowItems.filter(item => this.isRowChecked(item.row)).length
      return n > 0 && n < this.visibleRowItems.length
    },
    showFooterBlock () {
      if (!this.footerMethod) return false
      if (typeof this.showFooter === 'number') return this.showFooter > 0
      return !!this.showFooter
    },
    footerRows () {
      if (!this.footerMethod) return []
      const ret = this.footerMethod({ columns: this.bodyColumns, data: this.displayData })
      return Array.isArray(ret) ? ret : []
    },
    pagerSizeOptions () {
      const sizes = this.pagerConfig?.pageSizes
      if (!sizes) return ['10', '20', '50', '100']
      return sizes.map(String)
    },
    treeFirstDataColumnIndex () {
      return this.bodyColumns.findIndex(col => !['checkbox', 'radio', 'expand', 'seq'].includes(col.type))
    },
  },
  watch: {
    data: {
      deep: true,
      handler () {
        if (this.sortOrder && this.sortProperty && this.sortConfig && typeof this.sortConfig.sortMethod === 'function') {
          const col = this.getColumnByField(this.sortProperty)
          this.sortedDisplayData = this.sortConfig.sortMethod({
            data: this.tableData,
            column: withColumnProperty(col || { field: this.sortProperty }),
            property: this.sortProperty,
            order: this.sortOrder,
          })
        } else {
          this.sortedDisplayData = null
        }
      },
    },
  },
  mounted () {
    this.bindViewportObserver()
  },
  beforeUnmount () {
    this.unbindViewportObserver()
    this.teardownResize()
  },
  methods: {
    colKey (col) {
      return col.type || col.field || col.title || String(col)
    },
    rowKeyOf (row, index) {
      ensureRowXID(row)
      const k = this.effectiveRowKey
      if (k && row && row[k] != null) return row[k]
      if (row && row._XID != null) return row._XID
      return index
    },
    resolveColMinWidth (col) {
      if (col.type === 'checkbox' || col.type === 'radio') return SELECT_COL_WIDTH
      if (col.type === 'expand') return EXPAND_COL_WIDTH
      if (col.type === 'seq') return Number(col.width) || SEQ_COL_WIDTH
      const key = this.colKey(col)
      if (this.colWidths[key] != null) return this.colWidths[key]
      const w = Number(col.width) || Number(col.minWidth) || 100
      return Math.max(w, COL_MIN_WIDTH)
    },
    resolveColDisplayWidth (col) {
      const key = this.colKey(col)
      const mapped = this.colDisplayWidthMap[key]
      if (mapped != null) return mapped
      return this.resolveColMinWidth(col)
    },
    colGroupStyle (col) {
      const w = this.resolveColDisplayWidth(col)
      return { width: `${w}px`, minWidth: `${w}px` }
    },
    thStyle (col) {
      return this.colGroupStyle(col)
    },
    bodyTdStyle (col, row, rowIndex) {
      const style = { ...this.colGroupStyle(col) }
      if (col.align) style.textAlign = col.align
      if (typeof this.cellStyle === 'function') {
        const column = withColumnProperty(col)
        Object.assign(style, this.cellStyle({ row, rowIndex, column }) || {})
      }
      return style
    },
    footerTdStyle (col, rowIndex) {
      const style = { ...this.colGroupStyle(col) }
      if (typeof this.footerCellStyle === 'function') {
        const column = withColumnProperty(col)
        Object.assign(style, this.footerCellStyle({ rowIndex, column }) || {})
      }
      return style
    },
    thClass (col) {
      return [
        'table-lite-grid__th',
        col.sortable ? 'is-sortable' : '',
        this.canResize(col) ? 'is-resizable' : '',
        ['checkbox', 'radio', 'expand', 'seq'].includes(col.type) ? 'is-select' : '',
      ]
    },
    bodyTdClass (col, row, rowIndex) {
      const classes = [
        'table-lite-grid__td',
        this.useEllipsis && !['checkbox', 'radio', 'expand', 'seq'].includes(col.type) ? 'is-ellipsis' : '',
        ['checkbox', 'radio', 'expand', 'seq'].includes(col.type) ? 'is-select' : '',
      ]
      if (typeof this.cellClassName === 'function') {
        const extra = this.cellClassName({ row, rowIndex, column: withColumnProperty(col) })
        if (extra) classes.push(extra)
      }
      return classes
    },
    footerTdClass (col, rowIndex) {
      const classes = ['table-lite-grid__td', 'is-footer']
      if (typeof this.footerCellClassName === 'function') {
        const extra = this.footerCellClassName({ rowIndex, column: withColumnProperty(col) })
        if (extra) classes.push(extra)
      } else if (typeof this.cellClassName === 'function') {
        const extra = this.cellClassName({ rowIndex, column: withColumnProperty(col) })
        if (extra) classes.push(extra)
      }
      return classes
    },
    rowClass (row) {
      return {
        'is-checked': this.isRowChecked(row),
        'is-current': this.isRadioSelected(row),
        'is-editing': this.isEditByRow(row),
      }
    },
    canResize (col) {
      if (!this.effectiveResizable) return false
      if (['checkbox', 'radio', 'expand', 'seq'].includes(col.type)) return false
      if (col.resizable === false) return false
      // 无 field 的占位列不拖宽；分组父列不拖
      if (!col.field) return false
      if (col.children && col.children.length) return false
      return true
    },
    sortClass (col) {
      if (this.sortProperty !== col.field) return ''
      return this.sortOrder === 'asc' ? 'is-asc' : this.sortOrder === 'desc' ? 'is-desc' : ''
    },
    shouldRenderCell (rowIndex, colIndex) {
      return shouldRenderSpanCell(this.spanMap, rowIndex, colIndex)
    },
    cellSpan (rowIndex, colIndex) {
      return getSpanCell(this.spanMap, rowIndex, colIndex)
    },
    isTreeColumn (col, colIndex) {
      return !!this.treeConfig && colIndex === this.treeFirstDataColumnIndex
    },
    renderHeader (col) {
      return runWithCreateElement(legacyH, () => col.slots.header({ column: col }, legacyH))
    },
    isRowEditing (row) {
      return this.isEditByRow(row)
    },
    renderEditCell (col, row, rowIndex) {
      const editRender = col.editRender || {}
      const field = col.field
      const disabled = !!(editRender.attrs && editRender.attrs.disabled)
      if (editRender.name === 'select') {
        const options = editRender.options || []
        return h('a-select', {
          value: row[field],
          disabled,
          style: { width: '100%' },
          options,
          'onUpdate:value': (value) => this.onEditSelectChange(col, row, value),
        })
      }
      if (editRender.name === 'input') {
        const inputType = (editRender.attrs && editRender.attrs.type) || 'text'
        return h('a-input', {
          value: row[field],
          disabled,
          type: inputType,
          'onUpdate:value': (value) => {
            row[field] = inputType === 'number' ? Number(value) : value
          },
        })
      }
      return this.renderCell(col, row, rowIndex)
    },
    onEditSelectChange (col, row, value) {
      row[col.field] = value
      const events = col.editRender && col.editRender.events
      if (events && typeof events.change === 'function') {
        events.change({ row, data: this.tableData, column: col }, { target: { value } })
      }
    },
    renderBodyCell (col, row, rowIndex) {
      if (this.isRowEditing(row) && col.editRender) {
        return this.renderEditCell(col, row, rowIndex)
      }
      return this.renderCell(col, row, rowIndex)
    },
    renderCell (col, row, rowIndex) {
      const cellValue = row?.[col.field]
      const params = {
        row,
        column: withColumnProperty(col),
        $index: rowIndex,
        rowIndex,
        cellValue,
      }
      const defSlot = col.slots?.default
      if (typeof defSlot === 'string') {
        const named = this.$slots[defSlot]
        if (typeof named === 'function') return named(params)
      } else if (typeof defSlot === 'function') {
        return runWithCreateElement(legacyH, () => defSlot(params, legacyH))
      }
      if (typeof col.formatter === 'function') {
        return col.formatter(params)
      }
      const v = cellValue ?? ''
      return v
    },
    renderExpand (row, rowIndex) {
      const params = { row, rowIndex, $rowIndex: rowIndex }
      const contentSlot = this.normalizedColumns.find(c => c.type === 'expand')?.slots?.content ||
        this.normalizedColumns.find(c => c.slots?.content)?.slots?.content
      if (typeof contentSlot === 'function') {
        return runWithCreateElement(legacyH, () => contentSlot(params, legacyH))
      }
      if (this.expandConfig && typeof this.expandConfig.contentMethod === 'function') {
        return this.expandConfig.contentMethod(params)
      }
      return null
    },
    onHeaderClick (col) {
      // 自定义表头（如 MultipleSort）自行处理排序，避免与内置排序冲突
      if (col.slots && col.slots.header) return
      if (!col.sortable || !col.field) return
      let order = 'asc'
      if (this.sortProperty === col.field) {
        if (this.sortOrder === 'asc') order = 'desc'
        else if (this.sortOrder === 'desc') order = null
        else order = 'asc'
      }
      this.sortProperty = order ? col.field : ''
      this.sortOrder = order
      if (order && this.sortConfig && typeof this.sortConfig.sortMethod === 'function') {
        this.sortedDisplayData = this.sortConfig.sortMethod({
          data: this.tableData,
          column: withColumnProperty(col),
          property: col.field,
          order,
        })
      } else {
        this.sortedDisplayData = null
      }
      this.$emit('sort-change', {
        column: col,
        property: col.field,
        field: col.field,
        order,
      })
    },
    onRowClick (row, rowIndex) {
      this.$emit('row-click', { row, rowIndex })
      if (this.resolvedSelectionType === 'radio' || this.hasColumnType.has('radio') || this.radioConfig) {
        if (this.canSelectRadio(row)) this.onRadio(row)
      }
    },
    onCellClick (row, col, rowIndex) {
      this.$emit('cell-click', { row, column: withColumnProperty(col), rowIndex, $rowIndex: rowIndex })
    },
    onFooterCellClick (col, rowIndex) {
      this.$emit('footer-cell-click', { column: withColumnProperty(col), rowIndex })
    },
    isRowChecked (row) {
      const id = this.rowKeyOf(row)
      return id != null && !!this.checkedMap[id]
    },
    isRadioSelected (row) {
      if (!this.currentRow) return false
      return this.rowKeyOf(this.currentRow) === this.rowKeyOf(row)
    },
    canSelectRadio (row) {
      if (!this.radioConfig || typeof this.radioConfig.checkMethod !== 'function') return true
      return !!this.radioConfig.checkMethod({ row })
    },
    isExpanded (row) {
      const id = this.rowKeyOf(row)
      return id != null && !!this.expandedMap[id]
    },
    toggleExpand (row) {
      const id = this.rowKeyOf(row)
      if (id == null) return
      const next = !this.expandedMap[id]
      if (next) this.expandedMap[id] = true
      else delete this.expandedMap[id]
      this.expandedMap = { ...this.expandedMap }
      this.$emit('toggle-row-expand', { row, expanded: next })
    },
    toggleTreeRow (row) {
      const id = this.rowKeyOf(row)
      if (id == null) return
      const next = this.treeExpandedMap[id] === false
      if (next) delete this.treeExpandedMap[id]
      else this.treeExpandedMap[id] = false
      this.treeExpandedMap = { ...this.treeExpandedMap }
    },
    emitSelection () {
      const rows = this.tableData.filter(row => this.isRowChecked(row))
      this.$emit('selection-change', rows)
      this.$emit('checkbox-change', { records: rows })
    },
    toggleRowCheck (row, checked) {
      const id = this.rowKeyOf(row)
      if (id == null) return
      if (checked) this.checkedMap[id] = true
      else delete this.checkedMap[id]
      this.checkedMap = { ...this.checkedMap }
      this.emitSelection()
    },
    toggleCheckAll (checked) {
      if (checked) {
        const map = Object.create(null)
        this.visibleRowItems.forEach((item) => {
          const id = this.rowKeyOf(item.row)
          if (id != null) map[id] = true
        })
        this.checkedMap = map
      } else {
        this.checkedMap = Object.create(null)
      }
      this.emitSelection()
      this.$emit('checkbox-all', { records: this.getCheckboxRecords() })
    },
    onRadio (row) {
      this.currentRow = row
      this.$emit('radio-change', { row, newValue: row })
      this.$emit('selection-change', [row])
    },
    onPagerCurrentChange (page, pageSize) {
      this.$emit('page-change', {
        currentPage: page,
        pageSize,
        $event: { type: 'current' },
      })
    },
    onPagerSizeChange (current, size) {
      this.$emit('page-change', {
        currentPage: current,
        pageSize: size,
        $event: { type: 'size' },
      })
    },
    showPagerTotal (total) {
      return `${total}`
    },
    spinnerBarStyle (n) {
      return {
        transform: `rotate(${(n - 1) * 30}deg)`,
        animationDelay: `${-1.2 + (n - 1) * 0.1}s`,
      }
    },
    onResizeStart (e, col) {
      const key = this.colKey(col)
      const th = e.currentTarget && e.currentTarget.parentElement
      const scroll = this.$refs.scroll
      if (!th || !scroll) return
      this.updateViewportWidth()
      const thRect = th.getBoundingClientRect()
      const scrollRect = scroll.getBoundingClientRect()
      const startBase = this.resolveColMinWidth(col)
      const startVisual = this.resolveColDisplayWidth(col)
      const sumBase = this.colBaseSum
      const viewportW = this.viewportWidth || scroll.clientWidth
      const fillMode = viewportW > 0 && sumBase < viewportW
      const restBase = Math.max(0, sumBase - startBase)
      const line = document.createElement('div')
      line.className = 'table-lite-grid__resize-line'
      line.style.height = `${scroll.clientHeight}px`
      line.style.left = `${thRect.left - scrollRect.left + scroll.scrollLeft + startVisual}px`
      scroll.appendChild(line)
      this._resizeState = {
        key,
        col,
        startX: e.clientX,
        startBase,
        startVisual,
        thLeft: thRect.left,
        scroll,
        scrollRectLeft: scrollRect.left,
        line,
        fillMode,
        viewportW,
        restBase,
        pendingWidth: startBase,
        pendingVisual: startVisual,
      }
      document.body.classList.add('table-lite-grid-resizing')
      document.addEventListener('mousemove', this.onResizeMove)
      document.addEventListener('mouseup', this.onResizeEnd)
    },
    /**
     * 填充模式下：目标视觉宽 V → 基准宽 b，使分摊后仍为 V
     * b / (restBase + b) * W = V  ⇒  b = V * restBase / (W - V)
     */
    visualToBaseWidth (visual, restBase, viewportW) {
      const W = viewportW
      const V = Math.max(COL_MIN_WIDTH, Math.min(W - COL_MIN_WIDTH, visual))
      if (restBase <= 0) return Math.max(COL_MIN_WIDTH, Math.round(V))
      const denom = W - V
      if (denom <= 0) return Math.max(COL_MIN_WIDTH, Math.round(V))
      return Math.max(COL_MIN_WIDTH, Math.round(V * restBase / denom))
    },
    onResizeMove (e) {
      const state = this._resizeState
      if (!state) return
      const delta = e.clientX - state.startX
      let visual = Math.round(state.startVisual + delta)
      let base
      if (state.fillMode && state.viewportW > 0 && state.restBase > 0) {
        const minV = COL_MIN_WIDTH
        const maxV = Math.max(minV, state.viewportW - COL_MIN_WIDTH)
        visual = Math.max(minV, Math.min(maxV, visual))
        base = this.visualToBaseWidth(visual, state.restBase, state.viewportW)
        // 反算辅助线位置，与落宽后分摊结果一致
        const nextSum = state.restBase + base
        visual = nextSum > 0
          ? Math.round(base / nextSum * state.viewportW)
          : visual
      } else {
        visual = Math.max(COL_MIN_WIDTH, visual)
        base = visual
      }
      state.pendingWidth = base
      state.pendingVisual = visual
      if (state.line) {
        const left = state.thLeft - state.scrollRectLeft + state.scroll.scrollLeft + visual
        state.line.style.left = `${left}px`
      }
    },
    onResizeEnd () {
      const state = this._resizeState
      const width = state && state.pendingWidth
      const col = state && state.col
      const key = state && state.key
      this.teardownResize()
      if (!col || key == null || width == null) return
      const next = Math.max(COL_MIN_WIDTH, width)
      this.colWidths = { ...this.colWidths, [key]: next }
      this.$emit('column-resizable-change', {
        column: col,
        field: col.field,
        property: col.field,
        width: next,
      })
    },
    teardownResize () {
      const state = this._resizeState
      if (state && state.line && state.line.parentNode) {
        state.line.parentNode.removeChild(state.line)
      }
      this._resizeState = null
      document.body.classList.remove('table-lite-grid-resizing')
      document.removeEventListener('mousemove', this.onResizeMove)
      document.removeEventListener('mouseup', this.onResizeEnd)
    },
    bindViewportObserver () {
      this.$nextTick(() => {
        this.updateViewportWidth()
        const el = this.$refs.scroll
        if (!el) return
        if (typeof ResizeObserver !== 'undefined') {
          this._viewportRO = new ResizeObserver(() => this.updateViewportWidth())
          this._viewportRO.observe(el)
        } else {
          window.addEventListener('resize', this.updateViewportWidth, { passive: true })
        }
      })
    },
    unbindViewportObserver () {
      if (this._viewportRO) {
        this._viewportRO.disconnect()
        this._viewportRO = null
      }
      window.removeEventListener('resize', this.updateViewportWidth)
    },
    updateViewportWidth () {
      const el = this.$refs.scroll
      if (!el) return
      const w = Math.floor(el.clientWidth)
      if (w > 0 && w !== this.viewportWidth) this.viewportWidth = w
    },
    snapshotRow (row) {
      if (!this.keepSource || !row) return
      const id = this.rowKeyOf(row)
      this.sourceMap[id] = JSON.parse(JSON.stringify(row))
    },
    // ---- vxe 兼容方法 ----
    getCheckboxRecords () {
      return this.tableData.filter(row => this.isRowChecked(row))
    },
    clearCheckboxRow () {
      this.checkedMap = Object.create(null)
      this.emitSelection()
    },
    getRadioRecord () {
      return this.currentRow
    },
    setRadioRow (row) {
      this.currentRow = row || null
    },
    clearRadioRow () {
      this.currentRow = null
    },
    getRowById (id) {
      return this.tableData.find(row => String(this.rowKeyOf(row)) === String(id))
    },
    getRowNode (trElem) {
      if (!trElem) return { item: null }
      const id = trElem.getAttribute && trElem.getAttribute('data-row-id')
      const item = this.visibleRowItems.find(v => String(this.rowKeyOf(v.row)) === String(id))
      return { item: item ? item.row : null }
    },
    isTreeExpandByRow (row) {
      if (!this.treeConfig) return false
      const id = this.rowKeyOf(row)
      return this.treeExpandedMap[id] !== false
    },
    scrollToRow (row) {
      const id = row && typeof row === 'object' ? this.rowKeyOf(row) : row
      const el = this.$refs.scroll
      if (!el || id == null) return
      const tr = el.querySelector(`[data-row-id="${CSS.escape(String(id))}"]`)
      if (tr && tr.scrollIntoView) tr.scrollIntoView({ block: 'nearest' })
    },
    setAllRowExpand (expanded) {
      if (expanded) {
        const map = Object.create(null)
        this.tableData.forEach((row) => {
          const id = this.rowKeyOf(row)
          if (id != null) map[id] = true
        })
        this.expandedMap = map
      } else {
        this.expandedMap = Object.create(null)
      }
    },
    clearRowExpand () {
      this.setAllRowExpand(false)
    },
    reloadExpandContent () {},
    refreshColumn () {},
    getColumnByField (field) {
      return this.bodyColumns.find(col => col.field === field) ||
        this.leafColumns.find(col => col.field === field) ||
        this.normalizedColumns.find(col => col.field === field)
    },
    getTableColumn () {
      return {
        collectColumn: this.normalizedColumns,
        fullColumn: this.bodyColumns,
        tableColumn: this.bodyColumns,
      }
    },
    isEditByRow (row) {
      return !!row && this.editRow === row
    },
    getEditCell () {
      if (!this.editRow) return null
      const column = this.getColumnByField(this.editActiveField) || this.bodyColumns.find(c => c.editRender)
      return column ? { row: this.editRow, column } : { row: this.editRow, column: null }
    },
    async setEditRow (row) {
      if (row && this.keepSource) this.snapshotRow(row)
      this.editRow = row
      this.editActiveField = ''
      this.$emit('edit-actived', { row })
      return row
    },
    async setActiveRow (row) {
      return this.setEditRow(row)
    },
    async setActiveCell (row, field) {
      if (row && this.keepSource) this.snapshotRow(row)
      this.editRow = row
      this.editActiveField = field || ''
      this.$emit('edit-actived', { row })
      return row
    },
    async clearEdit () {
      const row = this.editRow
      this.editRow = null
      this.editActiveField = ''
      // 与 vxe clearEdit 一致：关闭编辑时触发 edit-closed
      if (row) this.$emit('edit-closed', { row })
    },
    async clearActived () {
      return this.clearEdit()
    },
    async revertData (row) {
      const id = this.rowKeyOf(row)
      const source = this.sourceMap[id]
      if (source && row) {
        Object.keys(row).forEach((key) => {
          if (key === '_XID') return
          if (Object.prototype.hasOwnProperty.call(source, key)) row[key] = source[key]
          else delete row[key]
        })
      }
      await this.clearEdit()
    },
    async insertAt (record, target) {
      const list = this.tableData
      let insertIndex = list.length
      if (typeof target === 'number') {
        insertIndex = target < 0 ? list.length : target
      } else if (target && typeof target === 'object') {
        const idx = list.indexOf(target)
        insertIndex = idx >= 0 ? idx : list.length
      }
      ensureRowXID(record)
      list.splice(insertIndex, 0, record)
      if (this.keepSource) this.snapshotRow(record)
      return { row: record }
    },
  },
}
</script>

<style lang="less" scoped>
.table-lite-grid {
  width: 100%;
  min-width: 0;
}
.table-lite-grid__scroll {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: auto;
  background: #fff;
  border-radius: 6px;
}
.table-lite-grid.is-bordered .table-lite-grid__scroll {
  border: 1px solid #e8e8e8;
}
// 列竖线：仅 border 开启时展示
.table-lite-grid.is-border .table-lite-grid__table {
  thead th,
  tbody td,
  tfoot td {
    border-right: 1px solid #e8e8e8;
  }
  tbody td,
  tfoot td {
    border-bottom-color: #e8e8e8;
  }
  thead th:last-child,
  tbody td:last-child,
  tfoot td:last-child {
    border-right: none;
  }
}
.table-lite-grid__loading-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  pointer-events: all;
}
.table-lite-grid__loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(0, 0, 0, 0.45);
}
.table-lite-grid__spinner {
  position: relative;
  width: 28px;
  height: 28px;
  i {
    position: absolute;
    left: 50%;
    top: 0;
    width: 2.5px;
    height: 8px;
    margin-left: -1.25px;
    border-radius: 1.5px;
    background: var(--ant-color-primary, #1890ff);
    transform-origin: 50% 14px;
    animation: table-lite-grid-spinner-fade 1.2s linear infinite;
  }
}
@keyframes table-lite-grid-spinner-fade {
  0% { opacity: 1; }
  100% { opacity: 0.15; }
}
.table-lite-grid__loading-text {
  font-size: 13px;
  line-height: 1.2;
}
.table-lite-grid__empty-placeholder {
  min-height: 120px;
}
.table-lite-grid__table {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 14px;

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;
    padding: 0;
    text-align: left;
    font-weight: 600;
    -webkit-font-smoothing: antialiased;
    white-space: nowrap;
    overflow: hidden;
  }
  tbody td,
  tfoot td {
    border-bottom: 1px solid #f0f0f0;
    padding: 12px 10px;
    vertical-align: middle;
    word-break: break-word;
  }
  tfoot td {
    background: #fafafa;
    font-weight: 600;
  }
}
.table-lite-grid.is-hover-row .table-lite-grid__table tbody tr:hover > td {
  background: #f5f7fa;
}
.table-lite-grid__table tbody tr.is-checked > td,
.table-lite-grid__table tbody tr.is-current > td {
  background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 5%, #fff);
}
.table-lite-grid.is-hover-row .table-lite-grid__table tbody tr.is-checked:hover > td,
.table-lite-grid.is-hover-row .table-lite-grid__table tbody tr.is-current:hover > td {
  background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, #fff);
}
.table-lite-grid.is-mini .table-lite-grid__table {
  font-size: 12px;
  thead th .table-lite-grid__th-inner,
  tbody td,
  tfoot td {
    padding: 6px 8px;
  }
}
.table-lite-grid__th-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 12px 10px;
  box-sizing: border-box;
  line-height: 1.2;
}
.table-lite-grid__th {
  position: relative;
}
.table-lite-grid__th.is-resizable .table-lite-grid__th-inner {
  padding-right: 16px;
}
.table-lite-grid__th-title {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--oc-color-text, #606266);
}
.table-lite-grid__th.is-sortable {
  cursor: pointer;
  user-select: none;
}
.table-lite-grid__th.is-select,
.table-lite-grid__td.is-select {
  width: 35px !important;
  min-width: 35px !important;
  max-width: 35px !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  text-align: center;
  box-sizing: border-box;
  overflow: hidden;
}
.table-lite-grid__th.is-select .table-lite-grid__th-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-left: 0;
  padding-right: 0;
}
.table-lite-grid__td.is-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-lite-grid__empty {
  padding: 24px 12px !important;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
}
.table-lite-grid__resizer {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  user-select: none;

  &::after {
    content: '';
    position: absolute;
    top: 25%;
    bottom: 25%;
    right: 0;
    left: auto;
    width: 1px;
    border-radius: 0;
    background: #d9d9d9;
  }

  &:hover::after {
    background: #1890ff;
  }
}
// 有列竖线时隐藏 resizer 视觉线，保留拖拽热区
.table-lite-grid.is-border .table-lite-grid__resizer {
  &::after,
  &:hover::after {
    display: none;
  }
}
.table-lite-grid__expand-btn,
.table-lite-grid__tree-btn {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s;
  &.is-open {
    transform: rotate(90deg);
  }
}
.table-lite-grid__tree-cell {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}
.table-lite-grid__tree-placeholder {
  display: inline-block;
  width: 18px;
  flex-shrink: 0;
}
.table-lite-grid__tree-content {
  flex: 1;
  min-width: 0;
}
.table-lite-grid__expand-cell {
  background: #fafafa;
  padding: 12px 16px !important;
}
.table-lite-grid__pager {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0 0;
}
.table-lite-grid__sort {
  display: inline-flex;
  flex-direction: column;
  margin-left: 4px;
  opacity: 0.35;
  i {
    display: block;
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
  }
  .table-lite-grid__sort-asc {
    border-bottom: 5px solid currentColor;
    margin-bottom: 2px;
  }
  .table-lite-grid__sort-desc {
    border-top: 5px solid currentColor;
  }
  &.is-asc,
  &.is-desc {
    opacity: 1;
    color: var(--ant-color-primary, #1890ff);
  }
  &.is-asc .table-lite-grid__sort-desc,
  &.is-desc .table-lite-grid__sort-asc {
    opacity: 0.35;
    color: inherit;
  }
}
</style>

<style lang="less">
body.table-lite-grid-resizing {
  cursor: col-resize !important;
  user-select: none !important;
  * {
    cursor: col-resize !important;
  }
}
.table-lite-grid__resize-line {
  position: absolute;
  top: 0;
  z-index: 20;
  width: 0;
  border-left: 1px solid #1890ff;
  pointer-events: none;
}
</style>
