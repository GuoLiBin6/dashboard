import {
  getCopyWithContentTableColumn,
  getStatusTableColumn,
  getEnabledTableColumn,
  getProjectTableColumn,
  getPublicScopeTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import {
  getTypeTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      {
        title: this.$t('system.text_101'),
        field: 'name',
        showOverflow: 'ellipsis',
        minWidth: 100,
        slots: {
          default: ({ row }, h) => {
            return [
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: row,
                  field: 'name',
                  hideField: true,
                },
              }, [
                h('side-page-trigger', {
                  on: {
                    trigger: () => this.handleOpenSidepage(row),
                  },
                }, row.name),
              ]),
            ]
          },
        },
      },
      getStatusTableColumn({ statusModule: 'robot' }),
      getEnabledTableColumn(),
      getTypeTableColumn(),
      getProjectTableColumn(),
      getPublicScopeTableColumn({ vm: this, resource: 'robots' }),
      getCopyWithContentTableColumn({
        title: 'Webhook/URL',
        field: 'address',
      }),
      getTimeTableColumn(),
    ]
  },
}
