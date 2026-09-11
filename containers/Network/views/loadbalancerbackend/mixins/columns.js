import LbListCell from '@Network/views/lb/components/LbListCell'
import {
  getNameDescriptionTableColumn,
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
        field: 'address',
        title: i18n.t('network.text_213'),
        minWidth: 150,
      },
      {
        field: 'port',
        title: i18n.t('network.text_165'),
        minWidth: 50,
      },
      {
        field: 'weight',
        title: i18n.t('network.text_166'),
        minWidth: 50,
      },
    ]
  },
}
