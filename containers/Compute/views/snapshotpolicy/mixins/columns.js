import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTagTableColumn,
  getProjectTableColumn,
  getRegionTableColumn,
  getBrandTableColumn,
  getAccountTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'
import { weekOptions, timeOptions } from '../constants'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row, 'detail'),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'snapshotpolicy', vm: this }),
      getTagTableColumn({ onManager: this.onManager, resource: 'snapshotpolicy', columns: () => this.columns }),
      getBrandTableColumn(),
      getAccountTableColumn(),
      {
        field: 'type',
        title: i18n.t('common.resource_type'),
        formatter: ({ row }) => {
          return row.type === 'server' ? i18n.t('dictionary.server') : i18n.t('dictionary.disk')
        },
      },
      {
        field: 'binding_disk_count',
        title: i18n.t('compute.bind_resource_count'),
        minWidth: 120,
        slots: {
          default: ({ row }, h) => {
            if (row.binding_disk_count === undefined) return [h('data-loading')]
            if (row.type === 'server') {
              if (row.binding_resource_count <= 0) return row.binding_resource_count
              return [
                h('side-page-trigger', {
                  props: {
                    name: 'SnapshotPolicySidePage',
                    id: row.id,
                    tab: 'snapshot-policy-server',
                    vm: this,
                  },
                }, row.binding_resource_count),
              ]
            }
            if (row.binding_disk_count <= 0) return row.binding_disk_count
            return [
              h('side-page-trigger', {
                props: {
                  name: 'SnapshotPolicySidePage',
                  id: row.id,
                  tab: 'snapshot-policy-disk',
                  vm: this,
                },
              }, row.binding_disk_count),
            ]
          },
        },
        formatter: ({ row }) => {
          if (row.type === 'server') {
            return row.binding_resource_count
          }
          return row.binding_disk_count
        },
      },
      {
        field: 'repeat_weekdays',
        title: i18n.t('table.title.strategy'),
        minWidth: 180,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            if (row.repeat_weekdays === undefined) return [h('data-loading')]
            let text = ''
            if (row.repeat_weekdays && row.repeat_weekdays.length) {
              text += i18n.t('compute.text_1098') + row.repeat_weekdays.map(item => weekOptions[item - 1]).join('、')
            }
            if (row.time_points && row.time_points.length) {
              text += '; ' + row.time_points.map(item => timeOptions[item]).join('、')
            }
            if (text) {
              text += i18n.t('compute.text_1099')
            }
            return [
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  field: 'repeat_weekdays',
                  hideField: true,
                  row,
                  message: text,
                },
              }, text),
            ]
          },
        },
        formatter: ({ row }) => {
          if (row.repeat_weekdays === undefined) return [this.$createElement('data-loading')]
          let text = ''
          if (row.repeat_weekdays && row.repeat_weekdays.length) {
            text += i18n.t('compute.text_1098') + row.repeat_weekdays.map(item => weekOptions[item - 1]).join('、')
          }
          if (row.time_points && row.time_points.length) {
            text += '; ' + row.time_points.map(item => timeOptions[item]).join('、')
          }
          if (text) {
            text += i18n.t('compute.text_1099')
          }
          return text || '-'
        },
      },
      {
        field: 'retention_days',
        title: this.$t('compute.text_433'),
        formatter: ({ row }) => {
          if (row.retention_count) {
            return `${this.$t('compute.retention_count_prefix')} ${row.retention_count} ${this.$t('compute.retention_count_suffix')}`
          }
          if (row.retention_days !== -1) {
            return this.$t('compute.text_438', [row.retention_days])
          }
          return this.$t('compute.text_1094')
        },
      },
      {
        field: 'snapshot_count',
        title: this.$t('compute.snapshot_count'),
        sortable: true,
        sortBy: 'order_by_snapshot_count',
        formatter: ({ row }) => {
          return row.snapshot_count || '-'
        },
      },
      getRegionTableColumn(),
      getTimeTableColumn(),
      getProjectTableColumn(),
    ]
  },
}
