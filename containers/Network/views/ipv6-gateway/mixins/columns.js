import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTimeTableColumn,
  getProjectTableColumn,
  getBrandTableColumn,
  getRegionTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        title: i18n.t('network.text_21'),
        edit: false,
        editDesc: false,
        slotCallback: row => {
          const h = this.$createElement
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'ipv6_gateway', title: i18n.t('network.text_27'), vm: this }),
      {
        field: 'vpc',
        title: 'VPC',
        minWidth: 100,
        formatter: ({ row }) => {
          return row.vpc || '-'
        },
        hidden: this.$store.getters.isProjectMode,
      },
      {
        field: 'instance_type',
        title: i18n.t('network.text_268'),
      },
      getBrandTableColumn(),
      {
        field: 'account',
        title: i18n.t('network.text_196'),
        minWidth: 120,
        slots: {
          default: ({ row }) => {
            const h = this.$createElement
            const ret = []
            ret.push(
              h('list-body-cell-wrap', {
                props: {
                  hideField: true,
                  copy: true,
                  field: 'account',
                  row,
                },
              }, [h('span', { style: { color: 'var(--oc-color-text-heading)' } }, row.account)]),
            )
            if (row.manager) {
              ret.push(
                h('list-body-cell-wrap', {
                  props: {
                    hideField: true,
                    copy: true,
                    field: 'manager',
                    row,
                  },
                }, [h('span', { style: { color: 'var(--oc-color-text-secondary)' } }, row.manager)]),
              )
            }
            return ret
          },
        },
        hidden: this.$store.getters.isProjectMode,
      },
      getProjectTableColumn(),
      getRegionTableColumn({ showOverflow: false }),
      getTimeTableColumn(),
    ]
  },
}
