<template>
  <div class="page-list-lite">
    <div class="page-list-lite__body" :class="{ 'has-tree': showTagConfig && treeToggleOpen }">
      <tree-project
        v-if="showTagConfig"
        ref="projectTag"
        v-show="treeToggleOpen"
        class="page-list-lite__tree"
        :treeToggleOpen="treeToggleOpen"
        :tag-config-params="{ config, ...tagConfigParams }"
        @select="onProjectTagSelect"
        @treeProjectConfig="() => {}" />
      <div class="page-list-lite__main">
        <table-lite-grid
          ref="grid"
          class="page-list-lite__grid"
          highlight-hover-row
          :show-overflow="false"
          :columns="tableColumns"
          :data="tableData"
          :loading="loading"
          :row-key="idKey"
          :row-config="{ keyField: idKey }"
          :expand-config="expandConfig"
          :edit-config="editConfig"
          :span-method="spanMethod"
          :max-height="lockHeight ? tableBodyMaxHeight : null"
          :empty-text="noDataText"
          @checkbox-change="onGridCheckboxChange"
          @checkbox-all="onGridCheckboxChange"
          @radio-change="onGridRadioChange"
          @column-resizable-change="onColumnResizableChange">
          <template #empty>
            <deny v-if="isResDeny" />
            <loader v-else :loading="false" :noDataText="noDataText" />
          </template>
        </table-lite-grid>

        <div v-if="loadMoreShow" class="page-list-lite__loadmore">
          <div class="page-list-lite__loadmore-meta">
            <a-select
              v-model:value="loadMoreSize"
              size="small"
              style="min-width:100px"
              @change="onLoadMoreSize">
              <a-select-option v-for="size in loadMorePagings" :key="size" :value="size">
                {{ $t('common.some_items_peer_time', [size]) }}
              </a-select-option>
            </a-select>
            <span class="ml-3">{{ $t('common.current_total_items', [tableData.length]) }}</span>
          </div>
          <a-button v-if="nextMarker" type="link" :loading="loading" @click="$emit('change-next-marker')">
            {{ loading ? $t('common.loding') : $t('common.LoadMore') }}
          </a-button>
          <span v-else>{{ $t('common.load_no_more') }}</span>
        </div>

        <list-pager
          v-if="showPage && !isResDeny && pagerType !== 'loadMore'"
          :current-page="tablePage.currentPage"
          :page-size="tablePage.pageSize"
          :total="tablePage.total"
          :page-sizes="pagerPageSizes"
          :selected-count="selectedListCount"
          @change-page="onPage"
          @change-size="onPageSize">
          <template v-if="!loading && showTableOverviewIndexs" #extra>
            <div class="table-overview">
              {{ $t('common.table.overview') }}：{{ tableOverview }}
            </div>
          </template>
        </list-pager>
      </div>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { mapGetters, mapState } from 'vuex'
import { getTagTitle } from '@/utils/common/tag'
import { runWithCreateElement } from '@/utils/common/tableColumn'
import legacyH from '@/utils/legacyCreateElement'
import { hasPermission } from '@/utils/auth'
import storage from '@/utils/storage'
import Actions from '@/components/PageList/Actions'
import ListPager from '@/components/PageList/components/ListPager.vue'
import Deny from '@/components/PageList/components/Deny.vue'
import Loader from '@/components/PageList/Loader.vue'
import MultipleSort from '@/components/PageList/components/MultipleSort.vue'
import TreeProject from '@/sections/TreeProject'

const SELECT_COL_WIDTH = 35
const COL_MIN_WIDTH = 50

/**
 * PageList 表格层：列表壳（分页 / loadMore / 列配置 / 排序协议）+ TableLiteGrid 内核。
 */
export default {
  name: 'PageListLiteTable',
  components: {
    ListPager,
    Deny,
    Loader,
    TreeProject,
  },
  props: {
    id: String,
    idKey: {
      type: String,
      default: 'id',
    },
    data: {
      type: Object,
      required: true,
    },
    columns: {
      type: Array,
      required: true,
    },
    list: Object,
    loading: Boolean,
    groupActions: Array,
    singleActions: {
      type: Array,
      default: () => [],
    },
    hideRowselect: {
      type: Boolean,
      default: false,
    },
    showSingleActions: {
      type: Boolean,
      default: true,
    },
    getLimit: {
      type: Function,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    offset: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    pagerLayout: Array,
    expandConfig: Object,
    config: Object,
    nextMarker: String,
    selectionType: {
      type: String,
      default: 'checkbox',
    },
    inBaseSidePage: {
      type: Boolean,
      default: false,
    },
    isSidepageOpen: Boolean,
    noDataText: String,
    showPage: {
      type: Boolean,
      default: true,
    },
    spanMethod: Function,
    beforeShowMenuLoaded: {
      type: Boolean,
      default: true,
    },
    beforeShowMenu: Function,
    tree: Boolean,
    treeToggleOpen: Boolean,
    showTagConfig: Boolean,
    tagConfigParams: Object,
    updateConfig: {
      type: Function,
      required: true,
    },
    editConfig: Object,
    tableOverviewIndexs: Array,
    enableVirtualScroll: {
      type: Boolean,
      default: true,
    },
    pagerType: String,
    resource: [String, Object, Function],
    tagColumnsGenerator: Function,
    tagColumns2Generator: Function,
    selected: Array,
    fixed: Boolean,
  },
  data () {
    const storageKey = this.id && `__oc_${this.id}__`
    return {
      storageKey,
      storageConfig: this.id && storage.get(storageKey),
      finalLimit: this.getLimit(),
      loadMoreSize: 20,
      loadMorePagings: [20, 100, 200, 500, 1000],
      tableBodyMaxHeight: 400,
      _debouncedInitHeight: null,
      _debouncedCloudShellInitHeight: null,
      // 全量列（含 visible:false）；TableLiteGrid 会过滤 visible
      tableColumns: [],
    }
  },
  computed: {
    ...mapGetters(['permission', 'globalRounded']),
    ...mapState('common', {
      cloudShellHeight: state => state.openCloudShell ? state.cloudShellHeight : 0,
    }),
    ...mapState('setting', {
      l2MenuVisibleForStore: state => state.l2MenuVisible,
      l2MenuContentShow: state => state.l2MenuContentShow,
    }),
    checkboxEnabled () {
      if (this.list && this.list.isTemplate) return false
      if (this.hideRowselect) return false
      return this.selectionType === 'checkbox'
    },
    radioEnabled () {
      if (this.list && this.list.isTemplate) return false
      return !this.hideRowselect && this.selectionType === 'radio'
    },
    effectiveLimit () {
      const n = Number(this.finalLimit) || Number(this.getLimit()) || Number(this.limit)
      return n > 0 ? n : 10
    },
    selectedListCount () {
      return Array.isArray(this.selected) ? this.selected.length : 0
    },
    pagerPageSizes () {
      const base = [10, 15, 20, 50, 100]
      const cur = this.effectiveLimit
      return [...new Set([...base, cur])].sort((a, b) => a - b)
    },
    tableData () {
      if (this.isResDeny) return []
      const dataList = Object.values(this.data || {}).sort((a, b) => a.index - b.index)
      return dataList.map(item => item.data)
    },
    tablePage () {
      const total = Number(this.total) || 0
      const safePageSize = this.effectiveLimit
      const offset = Number(this.offset) || 0
      return {
        total: Math.max(0, total),
        currentPage: Math.floor(offset / safePageSize) + 1,
        pageSize: safePageSize,
      }
    },
    loadMoreShow () {
      return this.pagerType === 'loadMore'
    },
    showTableOverviewIndexs () {
      return this.tableOverviewIndexs?.length > 0
    },
    tableOverview () {
      if (!this.showTableOverviewIndexs) return ''
      return this.tableOverviewIndexs.map(item => `${item.key}: ${item.value}`).join('、')
    },
    isResDeny () {
      return !hasPermission({ key: `${this.resource}_list`, permissionData: this.permission })
    },
    lockHeight () {
      return !!(this.enableVirtualScroll || this.inBaseSidePage || this.loadMoreShow)
    },
  },
  watch: {
    columns: {
      handler () {
        this.rebuildColumns()
      },
      immediate: true,
    },
    config: {
      handler () {
        this.rebuildColumns()
      },
      deep: true,
    },
    singleActions () {
      this.rebuildColumns()
    },
    selected: {
      handler (val) {
        if (!val || !val.length) {
          this.clearCheckbox()
          this.clearRadio()
        }
      },
    },
    cloudShellHeight () {
      if (this._debouncedCloudShellInitHeight) {
        this._debouncedCloudShellInitHeight()
        return
      }
      this.scheduleInitHeight()
    },
    loadMoreShow () {
      this.$nextTick(() => this.scheduleInitHeight())
    },
    pagerType () {
      this.$nextTick(() => this.scheduleInitHeight())
    },
    l2MenuVisibleForStore () {
      this.scheduleL2MenuResize()
    },
    l2MenuContentShow () {
      this.scheduleL2MenuResize()
    },
    treeToggleOpen () {
      this.$nextTick(() => this.scheduleInitHeight())
    },
  },
  created () {
    this._debouncedInitHeight = _.debounce(() => this.initHeight(), 100, {
      leading: true,
      trailing: true,
      maxWait: 160,
    })
    this._debouncedCloudShellInitHeight = _.debounce(() => {
      this.$nextTick(() => this.initHeight())
    }, 200, { leading: false, trailing: true })
  },
  mounted () {
    window.addEventListener('resize', this._debouncedInitHeight, { passive: true })
    window.addEventListener('scroll', this.onTableScroll, { passive: true, capture: true })
    this.$nextTick(() => {
      this.initHeight()
      this.bindScrollPause()
    })
  },
  beforeUnmount () {
    window.removeEventListener('resize', this._debouncedInitHeight)
    if (this._debouncedInitHeight) this._debouncedInitHeight.cancel()
    if (this._debouncedCloudShellInitHeight) this._debouncedCloudShellInitHeight.cancel()
    if (this._l2MenuResizeTimer) {
      clearTimeout(this._l2MenuResizeTimer)
      this._l2MenuResizeTimer = null
    }
    this.unbindScrollPause()
    window.removeEventListener('scroll', this.onTableScroll, { capture: true })
    if (this._pageRenderResumeTimer) {
      clearTimeout(this._pageRenderResumeTimer)
      this._pageRenderResumeTimer = null
    }
    if (this.list) this.list._pageRenderPaused = false
  },
  methods: {
    getScrollEl () {
      return this.$refs.grid && this.$refs.grid.$refs && this.$refs.grid.$refs.scroll
    },
    bindScrollPause () {
      const scrollEl = this.getScrollEl()
      if (scrollEl) {
        scrollEl.addEventListener('scroll', this.onTableScroll, { passive: true })
      }
    },
    unbindScrollPause () {
      const scrollEl = this.getScrollEl()
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', this.onTableScroll)
      }
    },
    onTableScroll () {
      const list = this.list
      if (!list) return
      list._pageRenderPaused = true
      if (this._pageRenderResumeTimer) clearTimeout(this._pageRenderResumeTimer)
      this._pageRenderResumeTimer = setTimeout(() => {
        this._pageRenderResumeTimer = null
        if (this.list) this.list._pageRenderPaused = false
      }, 120)
    },
    initHeight () {
      const el = this.getScrollEl() || this.$el
      if (!el || typeof el.getBoundingClientRect !== 'function') return
      const wH = window.innerHeight || document.documentElement.clientHeight
      const top = el.getBoundingClientRect().top
      const footerReserve = this.loadMoreShow
        ? 56
        : ((this.showPage && this.pagerType !== 'loadMore') ? 48 : 0)
      const shellGap = (this.globalRounded && this.cloudShellHeight > 0) ? 5 : 0
      const available = wH - top - 16 - footerReserve - this.cloudShellHeight - shellGap
      const next = available > 400 ? available : Math.max(200, available)
      if (Math.abs(this.tableBodyMaxHeight - next) > 4) {
        this.tableBodyMaxHeight = next
      }
    },
    scheduleInitHeight () {
      if (this._debouncedInitHeight) {
        this._debouncedInitHeight()
        return
      }
      this.initHeight()
    },
    scheduleL2MenuResize () {
      if (this._l2MenuResizeTimer) {
        clearTimeout(this._l2MenuResizeTimer)
        this._l2MenuResizeTimer = null
      }
      this._l2MenuResizeTimer = setTimeout(() => {
        this._l2MenuResizeTimer = null
        this.scheduleInitHeight()
      }, 250)
    },
    rebuildColumns () {
      const create = legacyH
      const renderSlot = (fn, params) => runWithCreateElement(create, () => fn(params, create))
      const hiddenColumns = (this.config && this.config.hiddenColumns) || []
      const storageConfig = this.storageConfig || {}

      let cols = (this.columns || [])
        .filter(item => {
          if (R.is(Function, item.hidden)) return !item.hidden()
          return !item.hidden
        })
        .map(item => ({ ...item }))

      const maps = this.config && this.config.sortColumnsMap
      if (!R.isNil(maps) && !R.isEmpty(maps)) {
        cols.sort((prev, next) => {
          const prevColumnIndex = _.get(maps, `${prev.field}`, 0)
          const nextColumnIndex = _.get(maps, `${next.field}`, 0)
          return prevColumnIndex - nextColumnIndex
        })
      }

      if (this.checkboxEnabled) {
        cols = [{ type: 'checkbox', width: SELECT_COL_WIDTH, resizable: false, visible: true }, ...cols]
      } else if (this.radioEnabled) {
        cols = [{ type: 'radio', width: SELECT_COL_WIDTH, resizable: false, visible: true }, ...cols]
      }

      if (this.beforeShowMenuLoaded && this.showSingleActions && this.singleActions?.length) {
        cols = cols.filter(c => c.field !== '_action' && c.field !== '_action_placeholder')
        cols.push({
          field: '_action',
          title: this.$t('table.title._action'),
          minWidth: 120,
          visible: true,
          slots: {
            default: ({ row }) => [
              create(Actions, {
                props: {
                  options: this.singleActions,
                  row,
                  buttonType: 'link',
                  buttonSize: 'small',
                  buttonStyle: { fontSize: '14px' },
                },
              }),
            ],
            header: () => [
              create('span', { style: { paddingLeft: '7px' } }, this.$t('table.title._action')),
            ],
          },
        })
      }

      cols.forEach(item => {
        if (item.type === 'checkbox' || item.type === 'radio' || item.field === '_action' || item.field === '_action_placeholder') {
          item.visible = true
          return
        }
        if (item.field && storageConfig[item.field] && storageConfig[item.field].width) {
          item.minWidth = storageConfig[item.field].width
          item.width = storageConfig[item.field].width
        }
        item.visible = !hiddenColumns.includes(item.field)
      })

      const buildTagColumn = (item, metaKey, tagType) => {
        const config = { minWidth: 100, visible: true }
        if (storageConfig[item] && storageConfig[item].width) {
          config.minWidth = storageConfig[item].width
          config.width = storageConfig[item].width
        }
        return {
          ...config,
          field: item,
          title: getTagTitle(item),
          sortable: true,
          slots: {
            tag_type: () => tagType,
            default: ({ row }) => {
              const message = row[metaKey] && row[metaKey][item]
              return [
                create('list-body-cell-wrap', {
                  props: { copy: true, field: item, row, message, hideField: true },
                }, message),
              ]
            },
          },
        }
      }

      if (this.config?.showTagKeys?.length) {
        let tagColumns = []
        if (this.tagColumnsGenerator) {
          tagColumns = this.tagColumnsGenerator(this.config.showTagKeys)
        } else {
          tagColumns = this.config.showTagKeys.map(item => buildTagColumn(item, 'metadata', 'resource'))
        }
        const insertIndex = this.checkboxEnabled ? 2 : 1
        cols = R.insertAll(insertIndex, tagColumns, cols)
      }

      if (this.config?.showProjectTagKeys?.length) {
        let tagColumns = []
        if (this.tagColumns2Generator) {
          tagColumns = this.tagColumns2Generator(this.config.showProjectTagKeys)
        } else {
          tagColumns = this.config.showProjectTagKeys.map(item => buildTagColumn(item, 'project_metadata', 'project'))
        }
        cols = R.insertAll(1, tagColumns, cols)
      }

      cols = cols.map(item => {
        if (item.type === 'checkbox' || item.type === 'radio') return item
        const next = { ...item }
        if (next.type !== 'checkbox' && next.type !== 'radio' && next.field !== '_action' && next.field !== '_action_placeholder') {
          next.minWidth = next.minWidth || 100
        }
        const originSlots = item.slots || {}
        const needSort = !!(next.sortable || next.sortFields || next.sortByList)
        const sortColumn = { ...next }
        if (next.sortable && !next.sortFields && !next.sortByList && next.field) {
          sortColumn.sortFields = [next.field]
        }
        const createSortNode = () => create(MultipleSort, {
          props: {
            column: sortColumn,
            listParams: (this.list && this.list.params) || {},
          },
          on: {
            doSort: this.handleSortChange,
          },
        })

        let headerSlot = originSlots.header
        if (needSort) {
          // 排序交给 MultipleSort，避免 TableLiteGrid 内置排序
          next.sortable = false
          if (originSlots.header) {
            const originHeader = originSlots.header
            headerSlot = (params) => {
              const nodes = renderSlot(originHeader, params)
              return [
                create('span', { class: 'page-list-lite__th-title' }, Array.isArray(nodes) ? nodes : [nodes]),
                createSortNode(),
              ]
            }
          } else {
            headerSlot = () => [
              create('span', { class: 'page-list-lite__th-title' }, [next.title]),
              createSortNode(),
            ]
          }
        } else if (originSlots.header) {
          const originHeader = originSlots.header
          headerSlot = (params) => renderSlot(originHeader, params)
        }

        next.slots = {
          ...originSlots,
          ...(headerSlot ? { header: headerSlot } : {}),
          default: (params) => {
            const row = params.row
            if (!(row && row.isDataShow)) {
              return ''
            }
            if (originSlots.default) return renderSlot(originSlots.default, params)
            if (next.formatter) return next.formatter({ ...params, cellValue: row && row[next.field] })
            return (row && row[next.field]) ?? ''
          },
        }
        return next
      })

      this.tableColumns = cols
    },
    handleSortChange ({ column, property, order }) {
      this.$emit('clear-selected')
      this.$emit('do-sort', property, order, column)
    },
    onGridCheckboxChange ({ records }) {
      this.$emit('change-selected', records || [])
    },
    onGridRadioChange ({ row }) {
      this.$emit('change-selected', row ? [row] : [])
      this.$emit('radio-change', row)
    },
    onColumnResizableChange ({ field, width }) {
      if (!field || width == null) return
      const nextWidth = Math.max(COL_MIN_WIDTH, Number(width) || COL_MIN_WIDTH)
      // 同步到当前列定义，避免后续 rebuild 丢宽
      const col = (this.tableColumns || []).find(c => c && c.field === field)
      if (col) {
        col.width = nextWidth
        col.minWidth = nextWidth
      }
      if (!this.storageKey) return
      const newConfig = R.mergeDeepRight({ ...(this.storageConfig || {}) }, {
        [field]: { width: nextWidth },
      })
      storage.set(this.storageKey, newConfig)
      this.storageConfig = newConfig
    },
    onPage (currentPage) {
      this.$emit('change-current-page', currentPage)
      this.$emit('clear-selected')
    },
    onPageSize (pageSize) {
      const ps = Number(pageSize) || 10
      this.finalLimit = ps
      this.$emit('change-page-size', ps)
    },
    onLoadMoreSize (val) {
      this.$emit('change-load-more-size', val)
    },
    clearCheckbox () {
      const grid = this.$refs.grid
      if (!grid || !grid.clearCheckboxRow) return
      // 静默清空：避免 selected 同步时再向外冒泡 change-selected
      grid.checkedMap = Object.create(null)
    },
    clearRadio () {
      const grid = this.$refs.grid
      if (!grid) return
      grid.currentRow = null
    },
    clearCurrentRow () {
      this.clearRadio()
    },
    setCurrentRow (data) {
      const grid = this.$refs.grid
      if (!grid) return
      const idKey = this.idKey || 'id'
      if (Array.isArray(data)) {
        grid.setRadioRow(data[0] || null)
        return
      }
      if (data && typeof data === 'object') {
        const id = data[idKey]
        const row = (this.tableData || []).find(r => r && r[idKey] === id) || data
        grid.setRadioRow(row)
        return
      }
      grid.clearRadioRow()
    },
    getTableColumn () {
      return {
        collectColumn: (this.tableColumns || []).map(col => ({
          ...col,
          property: col.field,
          visible: col.visible !== false,
        })),
      }
    },
    setAllRowExpand (...args) {
      return this.$refs.grid && this.$refs.grid.setAllRowExpand(...args)
    },
    clearRowExpand (...args) {
      return this.$refs.grid && this.$refs.grid.clearRowExpand(...args)
    },
    reloadExpandContent (...args) {
      return this.$refs.grid && this.$refs.grid.reloadExpandContent(...args)
    },
    onProjectTagSelect (payload) {
      this.$emit('project-tag-filter-change', payload)
    },
  },
}
</script>

<style lang="less" scoped>
.page-list-lite {
  min-width: 0;
  width: 100%;
}
.page-list-lite__body {
  display: flex;
  align-items: stretch;
  min-width: 0;
  width: 100%;
}
.page-list-lite__tree {
  flex: 0 0 auto;
  max-width: 400px;
  min-width: 0;
}
.page-list-lite__main {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
}
.page-list-lite__grid {
  :deep(.table-lite-grid__td) {
    /* 列表单元格内 Popover/Tooltip 需要可溢出 */
    overflow: visible;
  }
  :deep(.table-lite-grid__th-inner) {
    .sort-wrapper {
      margin-left: 6px;
      transform: none;
      flex-shrink: 0;
      vertical-align: middle;
    }
    .split {
      transform: rotate(15deg) translateY(-1px);
    }
  }
}
.page-list-lite__th-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: var(--oc-color-text, #606266);
}
.page-list-lite__loadmore {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 48px;
  padding: 0 8px;
}
.page-list-lite__loadmore-meta {
  position: absolute;
  right: 8px;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
.table-overview {
  font-size: 14px;
}
</style>
