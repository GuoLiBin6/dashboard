import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTagTableColumn,
  getBrandTableColumn,
  getAccountTableColumn,
} from '@/utils/common/tableColumn'

import {
  getVpcTableColumn,
  getPeerVpcTableColumn,
  getExtPeerAccountTableColumn,
} from '../utils/column'

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
      getStatusTableColumn({ statusModule: 'vpcPeerConnect', vm: this }),
      getTagTableColumn({ onManager: this.onManager, resource: 'vpc_peering_connections', columns: () => this.columns }),
      getVpcTableColumn(this),
      getPeerVpcTableColumn(),
      getExtPeerAccountTableColumn(),
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
