import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
} from '@/utils/common/tableColumn'
import {
  getCategoryTableColumn,
  getConditionTableColumn,
  getParameterTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'policydefinition' }),
      getCategoryTableColumn(),
      getConditionTableColumn(),
      getParameterTableColumn(),
    ]
  },
}
