import {
  getStatusTableColumn,
  getEnabledTableColumn,
  getNameDescriptionTableColumn,
  getCopyWithContentTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'
import {
  getResourceMatchProjectTableColumn,
} from '../utils/columns'
import {
  getLastSyncCostTableColumn,
} from '../../cloudaccount/utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
      }),
      {
        field: 'account',
        title: i18n.t('cloudenv.text_353'),
        showOverflow: 'ellipsis',
        minWidth: 160,
        slots: {
          default: ({ row }, h) => {
            const subscribeIds = (row.account && row.account.split('/')) || []
            const text = subscribeIds.length > 1 ? subscribeIds[1] : subscribeIds[0]
            return [
              h('list-body-cell-wrap', {
                props: { message: text, copy: true, hideField: true },
              }, [h('span', {}, text)]),
            ]
          },
        },
        formatter: ({ row }) => {
          const subscribeIds = (row.account && row.account.split('/')) || []
          const text = subscribeIds.length > 1 ? subscribeIds[1] : subscribeIds[0]
          return text
        },
      },
      getEnabledTableColumn(),
      getStatusTableColumn({ statusModule: 'cloudaccount' }),
      {
        field: 'last_sync',
        title: i18n.t('cloudenv.text_103'),
        width: 80,
        slots: {
          default: ({ row }) => {
            // 同步时间始终展示时间，不展示「同步中」
            const time = this.$moment(row.last_sync)
            if (time) {
              return time.fromNow()
            }
            return '-'
          },
        },
        formatter: ({ row }) => {
          const time = this.$moment(row.last_sync)
          if (time) {
            return time.fromNow()
          }
          return '-'
        },
      },
      getLastSyncCostTableColumn(),
      {
        field: 'sync_status',
        title: i18n.t('cloudenv.text_354'),
        minWidth: 100,
        slots: {
          default: ({ row }) => {
            return [
              this.$createElement('status', {
                props: { status: row.sync_status, statusModule: 'cloudaccountSyncStatus' },
              }),
            ]
          },
        },
      },
      getCopyWithContentTableColumn({
        field: 'project_domain',
        title: i18n.t('cloudenv.text_355', [i18n.t('dictionary.domain')]),
      }),
      getResourceMatchProjectTableColumn(),
    ]
  },
}
