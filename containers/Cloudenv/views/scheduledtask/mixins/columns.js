import {
  getNameDescriptionTableColumn,
  getEnabledTableColumn,
  getStatusTableColumn,
  getTimeTableColumn,
  getProjectTableColumn,
} from '@/utils/common/tableColumn'
import {
  getOperationColumns,
  getResourceTypeColumns,
  getResourceNumberColumns,
  // getLabelTypeColumns,
  getTimerDescColumns,
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
      getStatusTableColumn({ statusModule: 'scheduledtask', minWidth: 90 }),
      getEnabledTableColumn({ minWidth: 90 }),
      getOperationColumns(),
      getResourceTypeColumns(),
      getResourceNumberColumns(this),
      // getLabelTypeColumns(),
      getTimerDescColumns(),
      getTimeTableColumn(),
      getProjectTableColumn(),
    ]
  },
}
