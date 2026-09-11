import {
  getRegionTableColumn,
  getAccountTableColumn,
  getProjectDomainTableColumn,
  getBrandTableColumn,
  getStatusTableColumn,
  getNameDescriptionTableColumn,
} from '@/utils/common/tableColumn'
import {
  getVpcTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, [row.name])
        },
      }),
      getStatusTableColumn({ statusModule: 'routeTable', vm: this }),
      getVpcTableColumn(this),
      getBrandTableColumn({
        hidden: () => this.hiddenColumns.includes('brand'),
      }),
      getAccountTableColumn({
        hidden: () => this.hiddenColumns.includes('account'),
      }),
      getProjectDomainTableColumn(),
      getRegionTableColumn({
        hidden: () => this.hiddenColumns.includes('region'),
      }),
    ]
  },
}
