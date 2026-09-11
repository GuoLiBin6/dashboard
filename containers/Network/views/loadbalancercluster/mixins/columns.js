import {
  getNameDescriptionTableColumn,
  getRegionTableColumn,
  getTagTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
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
      getTagTableColumn({ onManager: this.onManager, resource: 'lb_loadbalancerclusters', columns: () => this.columns }),
      {
        field: 'params.virtual_router_id',
        title: 'Virtual Router ID',
        width: 200,
      },
      getRegionTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
