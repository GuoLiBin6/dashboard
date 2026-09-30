import {
  getNameDescriptionTableColumn,
  getCopyWithContentTableColumn,
  getTimeTableColumn,
  getPublicScopeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        resource: this.list.resource,
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getPublicScopeTableColumn({
        vm: this,
        resource: 'keypairs',
      }),
      getCopyWithContentTableColumn({ field: 'public_key', title: i18n.t('compute.text_725') }),
      getCopyWithContentTableColumn({ field: 'fingerprint', title: i18n.t('compute.text_726') }),
      {
        field: 'scheme',
        title: i18n.t('compute.text_175'),
      },
      {
        field: 'linked_guest_count',
        title: this.$t('compute.associated_instance_count'),
        width: 120,
        slots: {
          default: ({ row }, h) => {
            if (this.isPreLoad && row.linked_guest_count === undefined) return [h('data-loading')]
            if (!row.linked_guest_count) return row.linked_guest_count ?? 0
            return [
              h('side-page-trigger', {
                props: {
                  name: 'KeyPairSidePage',
                  id: row.id,
                  tab: 'associated-instances',
                  vm: this,
                  list: this.list,
                },
              }, row.linked_guest_count),
            ]
          },
        },
      },
      getTimeTableColumn(),
    ]
  },
}
