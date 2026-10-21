<template>
  <base-side-page
    @cancel="cancelSidePage"
    ref="BaseSidePage"
    :title="$t('storage.text_37')"
    icon="res-blockstorage"
    :res-name="detailData.name"
    :tabs="detailTabs"
    :current-tab="params.windowData.currentTab"
    :loaded="loaded"
    @tab-change="handleTabChange">
    <template v-slot:actions>
      <actions
        :options="singleActions"
        :row="detailData"
        button-type="link"
        button-size="small" />
    </template>
    <component
      :is="params.windowData.currentTab"
      v-bind="currentTabProps"
      @refresh="refresh" />
  </base-side-page>
</template>

<script>
import HostList from '@Compute/views/host/components/List'
import DiskRecoveryList from '@Compute/views/disk-recovery/components/List'
import CachedImages from '@Storage/views/blockstorage/sidepage/CachedImages'
import { STORAGE_TYPES } from '@Storage/constants/index.js'
import { getStatusTableColumn, getCopyWithContentTableColumn, getProjectTableColumn, getTimeTableColumn } from '@/utils/common/tableColumn'
import SidePageMixin from '@/mixins/sidePage'
import WindowsMixin from '@/mixins/windows'
import Actions from '@/components/PageList/Actions'
import Detail from './Detail'
import DiskList from './Disk'
import Monitor from './Monitor'
import SnapshotList from './Snapshot'
import SingleActionsMixin from '../mixins/singleActions'
import ColumnsMixin from '../mixins/columns'
export default {
  name: 'BlockStorageSidePage',
  components: {
    Actions,
    Detail,
    DiskList,
    DiskRecoveryList,
    HostList,
    Monitor,
    CachedImages,
    SnapshotList,
  },
  mixins: [SidePageMixin, WindowsMixin, ColumnsMixin, SingleActionsMixin],
  data () {
    return {
      detailTabs: [
        { label: this.$t('storage.text_81'), key: 'detail' },
        { label: this.$t('storage.text_50'), key: 'host-list' },
        { label: this.$t('storage.text_82'), key: 'disk-list' },
        { label: this.$t('compute.text_101'), key: 'snapshot-list' },
        { label: this.$t('storage.text_83'), key: 'disk-recovery-list' },
        { label: this.$t('storage.text_84'), key: 'cached-images' },
        { label: this.$t('compute.text_608'), key: 'monitor' },
        { label: this.$t('storage.text_85'), key: 'event-drawer' },
      ],
    }
  },
  computed: {
    getParams () {
      return {
        storage: this.data.id,
        details: true,
      }
    },
    getColumns () {
      if (this.params.windowData.currentTab === 'disk-recovery-list') {
        return [
          getCopyWithContentTableColumn({ field: 'name', title: this.$t('storage.text_40') }),
          getCopyWithContentTableColumn({ field: 'guest', title: this.$t('dictionary.server') }),
          {
            field: 'disk_type',
            title: this.$t('storage.text_86'),
            width: 70,
            formatter: ({ cellValue }) => {
              return cellValue === 'sys' ? this.$t('storage.text_87') : this.$t('storage.text_88')
            },
          },
          getStatusTableColumn({ statusModule: 'disk' }),
          getProjectTableColumn(),
          getTimeTableColumn({ field: 'auto_delete_at', title: this.$t('storage.text_89') }),
        ]
      }
      return null
    },
    isBlockStorage () {
      return ['rbd', 'slvm', 'nfs', 'gpfs'].includes(this.detailData.storage_type)
    },
    hostListActions () {
      const me = this
      return {
        // this = hostList
        frontGroupActions: function () {
          return [
            {
              label: this.$t('storage.text_66'),
              permission: 'storages_perform_storages',
              action: () => {
                this.createDialog('AssociatedHostDialog', {
                  data: [me.detailData],
                  columns: me.columns,
                  title: this.$t('storage.text_66'),
                  onManager: this.onManager,
                  refresh: this.refresh,
                })
              },
              meta: () => {
                return {
                  validate: me.isBlockStorage,
                  tooltip: !me.isBlockStorage && this.$t('storage.text_67', [STORAGE_TYPES[me.detailData.storage_type] || me.detailData.storage_type]),
                }
              },
            },
            {
              label: this.$t('storage.text_90'),
              action: () => {
                this.createDialog('UnAssociatedHostDialog', {
                  title: this.$t('storage.text_90'),
                  data: this.list.selectedItems,
                  columns: this.columns,
                  list: this.list,
                  resId: me.getParams.storage,
                })
              },
              meta: () => {
                return {
                  validate: this.list.selectedItems.length > 0 && me.isBlockStorage,
                }
              },
            },
          ]
        },
        frontSingleActions: function () {
          return [
            {
              label: this.$t('storage.text_90'),
              action: (row) => {
                this.createDialog('UnAssociatedHostDialog', {
                  title: this.$t('storage.text_90'),
                  data: [row],
                  columns: this.columns,
                  list: this.list,
                  resId: me.getParams.storage,
                })
              },
              meta: () => {
                return {
                  validate: me.isBlockStorage,
                }
              },
            },
          ]
        },
      }
    },
    listId () {
      switch (this.params.windowData.currentTab) {
        case 'event-drawer':
          return 'EventListForBlockStorageSidePage'
        case 'host-list':
          return 'HostListForBlockStorageSidePage'
        case 'disk-list':
          return 'DiskListForBlockStorageSidePage'
        case 'disk-recovery-list':
          return 'DiskRecoveryListForBlockStorageSidePage'
        case 'snapshot-list':
          return 'SnapshotListForBlockStorageSidePage'
        default:
          return ''
      }
    },
    // Vue3：勿把主列表 list/columns/resource 广播到子 tab，否则会覆盖子列表自身绑定导致空白
    currentTabProps () {
      const tab = this.params.windowData.currentTab
      const common = {
        data: this.detailData,
        onManager: this.onManager,
        refresh: this.refresh,
        getParams: this.getParams,
        id: this.listId,
        resId: this.getParams.storage,
      }
      if (tab === 'detail') {
        return {
          data: this.detailData,
          onManager: this.onManager,
          refresh: this.refresh,
          columns: this.columns,
        }
      }
      if (tab === 'host-list') {
        return {
          ...common,
          ...this.hostListActions,
        }
      }
      if (tab === 'disk-recovery-list') {
        return {
          ...common,
          getColumns: this.getColumns,
        }
      }
      if (tab === 'cached-images') {
        return {
          data: this.detailData,
          getParams: { details: true },
        }
      }
      if (tab === 'monitor') {
        return {
          data: this.detailData,
        }
      }
      if (tab === 'event-drawer') {
        return {
          resId: this.data.id,
          id: this.listId,
          getParams: this.getParams,
        }
      }
      // disk-list / snapshot-list
      return common
    },
  },
  created () {
    if (this.params.tab) this.handleTabChange(this.params.tab)
  },
}
</script>
