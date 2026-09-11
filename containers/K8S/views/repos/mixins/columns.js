import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import {
  getTypeTableColumn,
  getUrlTableColumn,
  getCredentialTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: row => {
          return this.$createElement('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getTypeTableColumn(),
      getStatusTableColumn({ statusModule: 'k8s_repo' }),
      getUrlTableColumn(),
      getCredentialTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
