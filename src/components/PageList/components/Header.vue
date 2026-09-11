<template>
  <page-toolbar>
    <div class="mb-2 d-flex page-list-header-actions" v-if="showGroupActions && beforeShowMenuLoaded">
      <div class="page-list-header-actions__main d-flex align-items-center">
        <!-- 刷新 -->
        <a-button
          v-if="showSync"
          class="flex-shrink-0"
          :disabled="loading"
          @click="handleRefresh">
          <icon v-if="loading" type="refresh" spin />
          <icon v-else type="refresh" />
        </a-button>
        <!-- 批量前面追加内容 slot -->
        <slot name="group-actions-prepend" />
        <!-- 批量操作 -->
        <template v-if="showGroupActions && groupActions">
          <actions
            group
            class="flex-shrink-0"
            :options="groupActions"
            :rows="selectedItems"
            button-type="default"
            :show-sync="showSync"
            @clear-selected="() => $emit('clear-selected')" />
        </template>
        <!-- 批量后面追加内容 slot -->
        <slot name="group-actions-append" />
        <!-- 标签过滤器 -->
        <template v-if="showTagFilter">
          <tag-filter
            :resource="tagFilterResource || resource"
            :tag-manager-instance="tagManagerInstance"
            :ignoreWithUserMetaParam="ignoreWithUserMetaParam"
            :tag-filter="tagFilter"
            :extTagParams="extTagParams"
            :show-ext-tags="showExtTags"
            :show-no-value="showNoValue"
            :with-tag-key="tagFilterKeys[0]"
            :without-tag-key="tagFilterKeys[1]"
            :button-text="tagBtnText || $t('common.text00012')"
            :flexFill="false"
            @tag-filter-change="(tagFilter) => $emit('tag-filter-change', tagFilter)" />
        </template>
        <!-- 资源标签过滤器 -->
        <template v-if="!$isScopedPolicyMenuHidden('fee_hidden_items.instance_tag') && showTagFilter3">
          <tag-filter
            :resource="tagFilterResource3 || resource"
            :tag-manager-instance="tagManagerInstance3"
            :ignoreWithUserMetaParam="ignoreWithUserMetaParam3"
            :tag-filter="tagFilter3"
            :extTagParams="extTagParams3"
            :show-ext-tags="showExtTags3"
            :show-no-value="showNoValue3"
            :with-tag-key="tagFilterKeys3[0]"
            :without-tag-key="tagFilterKeys3[1]"
            :button-text="$t('dictionary.instance_tag')"
            :filter-with-user-meta="true"
            :filter-without-user-meta="true"
            :flexFill="false"
            @tag-filter-change="(tagFilter) => $emit('tag-filter-change3', tagFilter)" />
        </template>
        <!-- 标签过滤器 -->
        <template v-if="showTagFilter2">
          <tag-filter
            :resource="tagFilterResource2 || resource"
            :tag-manager-instance="tagManagerInstance2"
            :ignoreWithUserMetaParam="ignoreWithUserMetaParam2"
            :tag-filter="tagFilter2"
            :extTagParams="extTagParams2"
            :show-ext-tags="showExtTags2"
            :show-no-value="showNoValue2"
            :with-tag-key="tagFilterKeys2[0]"
            :without-tag-key="tagFilterKeys2[1]"
            :button-text="$t('dictionary.project_tag')"
            :filter-with-user-meta="true"
            :filter-without-user-meta="true"
            @tag-filter-change="(tagFilter) => $emit('tag-filter-change2', tagFilter)" />
        </template>
        <span class="page-list-header-actions__stats" v-if="pagerType === 'pager'">{{ $t('common.page_list_header_item_count_stats', [dataList.length, selected.length, total]) }}</span>
        <span class="page-list-header-actions__stats" v-else>{{ $t('common.page_list_header_item_count_stats1', [dataList.length, selected.length]) }}</span>
      </div>
      <div class="page-list-header-actions__right d-flex flex-shrink-0 align-items-center">
        <div class="page-list-header-actions__tools d-flex align-items-center">
          <slot name="right-tools-prepend" />
          <template v-if="exportDataOptions || (id && !hiddenListConfig) || !hiddenPin">
            <a-tooltip :title="pinTip" v-if="!hiddenPin">
              <a-button @click="handlePin" :disabled="!selected.length && !isPinActive" :type="isPinActive ? 'primary' : 'default'">
                <icon type="pin" />
              </a-button>
            </a-tooltip>
            <a-tooltip :title="$t('common.text00010')" v-if="exportDataOptions">
              <a-button @click="handleExportData">
                <icon type="download" />
              </a-button>
            </a-tooltip>
            <a-tooltip :title="$t('common.text00011')" v-if="id && !hiddenListConfig">
              <a-button @click="handleCustomList">
                <icon type="setting" />
              </a-button>
            </a-tooltip>
          </template>
        </div>
      </div>
    </div>
    <!-- 搜索框 -->
    <template v-if="showSearchbox && _filterOptions">
      <div class="d-flex align-items-center search-row">
        <!-- 层级选择开关：仅展示时占位，避免 search-box 左侧多余间距 -->
        <a-tooltip v-if="showTagConfig" :title="treeToggleOpen ? $t('common.toggle_project_close') : $t('common.toggle_project_open')">
          <a-button class="flex-shrink-0" @click="toggleTreeSelect">
            <icon type="apartment" />
          </a-button>
        </a-tooltip>
        <div class="flex-fill">
          <search-box
            :options="_filterOptions"
            :value="filter"
            :default-search-key="defaultSearchKey"
            :placeholder="placeholder"
            :fetch-distinct-field="fetchDistinctField"
            @input="handleSearchInput" />
        </div>
      </div>
    </template>
  </page-toolbar>
</template>

<script>
import * as R from 'ramda'
import WindowsMixin from '@/mixins/windows'
import Actions from '../Actions'
import TagFilter from '../TagFilter'

export default {
  name: 'PageListHeader',
  components: {
    Actions,
    TagFilter,
  },
  mixins: [WindowsMixin],
  props: {
    id: String,
    // 是否加载中
    loading: Boolean,
    // 是否显示刷新按钮
    showSync: {
      type: Boolean,
      default: true,
    },
    // 是否显示批量操作区域
    showGroupActions: {
      type: Boolean,
      default: true,
    },
    // 操作按钮配置
    groupActions: Array,
    // 提供给标签过滤器自定义获取标签数据的Manager实例
    tagManagerInstance: Object,
    tagManagerInstance2: Object,
    tagManagerInstance3: Object,
    // 开启标签过滤
    showTagFilter: Boolean,
    showTagFilter2: Boolean,
    showTagFilter3: Boolean,
    tagFilter: Object,
    tagFilter2: Object,
    tagFilter3: Object,
    // create list传递的resource
    resource: [String, Object, Function],
    showSearchbox: Boolean,
    filterOptions: Object,
    filter: Object,
    defaultSearchKey: [String, Function],
    placeholder: String,
    onManager: Function,
    params: Object,
    // 导出数据配置
    exportDataOptions: Object,
    extraExportParams: [Object, Function],
    refreshMethod: Function,
    config: Object,
    // 开启标签列
    showTagColumns: Boolean,
    tagColumnManager: Function,
    tagColumnParamsFormatter: Function,
    showTagColumns2: Boolean,
    showTagColumns3: Boolean,
    tagColumn2Resource: String,
    tagColumn2ParamsFormatter: Function,
    getGrid: {
      type: Function,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    limit: {
      type: Number,
      required: false,
    },
    selected: {
      type: Array,
      required: true,
    },
    selectedItems: {
      type: Array,
      required: true,
    },
    apiVersion: {
      type: String,
      default: 'v1',
    },
    updateConfig: {
      type: Function,
      required: true,
    },
    fetchDistinctField: {
      type: Function,
      required: true,
    },
    beforeShowMenuLoaded: {
      type: Boolean,
    },
    extTagParams: {
      type: Object,
      default () {
        return {}
      },
    },
    showExtTags: {
      type: Boolean,
    },
    extTagParams2: {
      type: Object,
      default () {
        return {}
      },
    },
    extTagParams3: {
      type: Object,
      default () {
        return {}
      },
    },
    showExtTags2: {
      type: Boolean,
    },
    showExtTags3: {
      type: Boolean,
    },
    showTagConfig: Boolean,
    tagConfigParams: Object,
    treeToggleOpen: Boolean,
    showNoValue: Boolean,
    showNoValue2: Boolean,
    showNoValue3: Boolean,
    tagFilterKeys: Array,
    tagFilterKeys2: Array,
    tagFilterKeys3: Array,
    tagFilterResource: String,
    tagFilterResource2: String,
    tagFilterResource3: String,
    ignoreWithUserMetaParam: Boolean,
    ignoreWithUserMetaParam2: Boolean,
    ignoreWithUserMetaParam3: Boolean,
    tagColumnsGenerator: Function,
    tagColumns2Generator: Function,
    tagColumnsExportKeyFormatter: Function,
    tagColumns2ExportKeyFormatter: Function,
    tagColumns3ExportKeyFormatter: Function,
    tagBtnText: String,
    hiddenExportKeys: Array,
    hiddenPin: Boolean,
    hiddenListConfig: Boolean,
    idKey: String,
    exportUseIdKey: Boolean,
    // PageList 传入的 data 是 CreateList.wrapData 生成的对象（key->row），不是数组
    // 这里兼容两种形态，避免 Vue warn 在频繁渲染时刷屏导致内存/CPU 暴涨。
    data: [Array, Object],
    pagerType: String,
  },
  data () {
    return {
      isPinActive: false,
    }
  },
  computed: {
    _filterOptions () {
      if (!this.filterOptions || R.isEmpty(this.filterOptions)) return null
      const filterOptions = R.filter(item => {
        if (R.is(Function, item.hidden)) {
          return !item.hidden()
        }
        return !item.hidden
      }, this.filterOptions)
      const filterSortKeys = ['external_id', 'id', 'search', 'name', 'description', 'brand', 'provider', 'ip', 'ips', 'status', 'llm_type', 'enabled', 'sn', 'os_type', 'cidr', 'ports', 'tenant', 'region', 'host', 'billing_type']
      const ret = {}
      filterSortKeys.forEach(k => {
        const _k = k.toLowerCase()
        if (filterOptions[_k]) {
          ret[_k] = filterOptions[_k]
        }
      })
      Object.keys(filterOptions).forEach(k => {
        const _k = k.toLowerCase()
        if (!ret[_k]) {
          ret[_k] = filterOptions[_k] || filterOptions[k]
        }
      })
      return ret
    },
    pinTip () {
      if (this.isPinActive) {
        return this.$t('common.cancel_pin')
      } else {
        if (this.selected.length) {
          return 'Pin'
        } else {
          return this.$t('common.select_pin_data')
        }
      }
    },
    pageLimit () {
      if (this.limit > 0 && this.limit < this.total) {
        return this.limit
      }
      return this.total
    },
    dataList () {
      if (Array.isArray(this.data)) return this.data
      if (this.data && typeof this.data === 'object') return Object.values(this.data)
      return []
    },
  },
  methods: {
    handlePin () {
      this.isPinActive = !this.isPinActive
      if (this.isPinActive) {
        this.$emit('savePinFilter')
        this.$emit('clear-selected')
      } else {
        this.$emit('restorePinFilter')
        this.$emit('clear-selected')
      }
    },
    handleRefresh () {
      if (this.refreshMethod) {
        this.refreshMethod(() => {
          this.$emit('clear-selected')
        })
      } else {
        this.$emit('refresh')
        this.$emit('clear-selected')
      }
    },
    handleSearchInput (filter) {
      this.$emit('clear-selected')
      this.$emit('filter-change', filter)
    },
    async handleExportData () {
      if (R.is(Function, this.exportDataOptions.beforeExport)) {
        await this.exportDataOptions.beforeExport()
      }
      this.createDialog('ExportListDataDialog', {
        title: this.exportDataOptions.title || this.$t('common.text00010'),
        config: this.config,
        total: this.total,
        currentPageTotal: this.dataList.length,
        options: this.exportDataOptions,
        extraParams: this.extraExportParams,
        listParams: this.params,
        selected: this.selected,
        selectedItems: this.selectedItems,
        apiVersion: this.apiVersion,
        resource: this.resource,
        showTagColumns: this.showTagColumns,
        showTagColumns2: this.showTagColumns2,
        showTagColumns3: this.showTagColumns3,
        hiddenExportKeys: this.hiddenExportKeys,
        callback: this.exportDataOptions.callback,
        tagColumnsGenerator: this.tagColumnsGenerator,
        tagColumns2Generator: this.tagColumns2Generator,
        tagColumnsExportKeyFormatter: this.tagColumnsExportKeyFormatter,
        tagColumns2ExportKeyFormatter: this.tagColumns2ExportKeyFormatter,
        tagColumns3ExportKeyFormatter: this.tagColumns3ExportKeyFormatter,
        idKey: this.idKey,
        exportUseIdKey: this.exportUseIdKey,
        limit: this.pageLimit,
      })
    },
    handleCustomList () {
      const grid = this.getGrid()
      const cols = grid.getTableColumn().collectColumn || []
      let nameIndex = 0
      const hidenColumns = []
      if (cols.length) {
        const colType = cols[0].type
        nameIndex = colType === 'checkbox' ? 1 : 0
        hidenColumns.push(cols[nameIndex].property)
      }
      this.createDialog('CustomListDialog', {
        title: this.$t('common.text00011'),
        config: this.config,
        update: this.updateConfig,
        showTagColumns: this.showTagColumns,
        showTagColumns2: this.showTagColumns2,
        showTagColumns3: this.showTagColumns3,
        customs: grid.getTableColumn().collectColumn,
        resource: this.resource,
        tagColumnManager: this.tagColumnManager,
        tagColumnParamsFormatter: this.tagColumnParamsFormatter,
        tagColumn2Resource: this.tagColumn2Resource,
        tagColumn2ParamsFormatter: this.tagColumn2ParamsFormatter,
        hidenColumns,
      })
    },
    toggleTreeSelect () {
      this.$emit('treeToggleClick')
    },
  },
}
</script>

<style lang="less" scoped>
/* 与上方操作行 mb-2 间距一致；按钮尺寸跟刷新按钮同为默认 ant-btn */
.search-row {
  gap: 5px;
}
.page-list-header-actions {
  // 外层不换行：左侧自适应换行，右侧始终吸右
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 12px;
}
.page-list-header-actions__main {
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 8px 5px;
  min-width: 0;
  > * {
    flex-shrink: 0;
    // 按内容宽度占位，避免 checkbox 文案被挤成逐字换行
    min-width: max-content;
    max-width: 100%;
  }
  :deep(.ant-checkbox-wrapper) {
    white-space: nowrap;
  }
}
.page-list-header-actions__right {
  flex: 0 0 auto;
  gap: 8px;
  margin-left: auto;
  align-self: flex-start;
  white-space: nowrap;
}
.page-list-header-actions__tools {
  gap: 5px;
}
.page-list-header-actions__stats {
  white-space: nowrap;
  line-height: 32px;
  color: rgba(0, 0, 0, 0.65);
}
</style>
