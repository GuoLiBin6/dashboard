import {
  getNameDescriptionTableColumn,
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
      {
        field: 'advertise_addr',
        title: i18n.t('network.ssh-agent.advertise_addr'),
        minWidth: 100,
      },
      {
        field: 'bind_addr',
        title: i18n.t('network.ssh-agent.bind_addr'),
        minWidth: 100,
      },
      getTimeTableColumn({
        field: 'created_at',
        title: this.$t('common.createdAt'),
      }),
      getTimeTableColumn({
        field: 'updated_at',
        title: this.$t('common.updatedAt'),
      }),
    ]
  },
}
