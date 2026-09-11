import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTagTableColumn,
  getBrandTableColumn,
  getAccountTableColumn,
} from '@/utils/common/tableColumn'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'vpcNetwork', vm: this }),
      getTagTableColumn({ onManager: this.onManager, resource: 'inter_vpc_networks', columns: () => this.columns }),
      {
        field: 'vpc_count',
        title: this.$t('network.text_243'),
        minWidth: 100,
        sortable: true,
        slots: {
          default: ({ row }, h) => {
            return [h('side-page-trigger', {
              props: {
                name: 'VpcNetworkSidePage',
                id: row.id,
                tab: 'vpc',
                vm: this,
                init: true,
              },
            }, row.vpc_count)]
          },
        },
      },
      {
        field: 'project',
        title: this.$t('common.attribution_scope'),
        slots: {
          default: ({ row }, h) => {
            const ret = []
            const domain = row.project_domain || row.domain
            if (domain) {
              ret.push(
                h('list-body-cell-wrap', {
                  props: {
                    hideField: true,
                    copy: true,
                    field: 'domain',
                    row: { domain },
                  },
                }, [h('span', domain)]),
              )
            }
            return ret
          },
        },
      },
      getBrandTableColumn(),
      getAccountTableColumn({ vm: this }),
    ]
  },
}
