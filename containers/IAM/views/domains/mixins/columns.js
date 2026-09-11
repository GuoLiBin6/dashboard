import {
  getNameDescriptionTableColumn,
  getEnabledTableColumn,
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
        formRules: [
          { required: true, message: i18n.t('system.text_168') },
        ],
        slotCallback: row => {
          return this.$createElement('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getTagTableColumn({ onManager: this.onManager, resource: 'domains', params: { service: 'identity', resources: 'domain' }, columns: () => this.columns, tipName: this.$t('dictionary.domain') }),
      getEnabledTableColumn(),
      {
        field: 'idp',
        title: this.$t('dictionary.identity_provider'),
        slots: {
          default: ({ row }, h) => {
            if (!row.idp) return '-'
            const text = row.idp
            return [
              h('side-page-trigger', {
                props: {
                  name: 'IDPSidePage',
                  tab: 'idp-detail',
                  id: row.idp_id,
                  vm: this,
                },
              }, text),
            ]
          },
        },
      },
      getTimeTableColumn(),
    ]
  },
}
