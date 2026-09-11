import LbListCell from '@Network/views/lb/components/LbListCell'
import {
  getNameDescriptionTableColumn,
  getRegionTableColumn,
  getStatusTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  components: {
    LbListCell,
  },
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        title: i18n.t('network.text_21'),
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'lb' }),
      {
        field: 'listeners',
        title: i18n.t('network.text_355'),
        width: 100,
        slots: {
          default: ({ row }, h) => {
            if (row.listeners && row.listeners.length > 0) {
              const list = row.listeners.filter(item => item.redirect === 'off').map(item => h('a-tag', { class: 'mb-2 mr-1' }, `${item.name}(${item.listener_type}: ${item.listener_port})`))
              return [h('list-body-cell-popover', {
                props: {
                  text: i18n.t('compute.text_619', [row.lb_listener_count || 0]),
                  maxWidth: '400px',
                },
              }, [
                h('div', { style: 'display: inline-flex; flex-wrap: wrap; max-width: 40vw;' }, list),
              ])]
            }
            return i18n.t('compute.text_619', [row.lb_listener_count || 0])
          },
        },
      },
      getRegionTableColumn(),
    ]
  },
}
