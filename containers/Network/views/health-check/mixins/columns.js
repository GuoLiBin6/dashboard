import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTimeTableColumn,
  getProjectTableColumn,
  getBrandTableColumn,
  getAccountTableColumn,
} from '@/utils/common/tableColumn'
import {
  healthCheckTypeColumn,
  healthCheckUriColumn,
  healthCheckPortColumn,
  // healthCheckDomainColumn,
  healthCheckMethodColumn,
  healthCheckHttpCodeColumn,
  healthCheckIntervalColumn,
  healthCheckTimeoutColumn,
  healthCheckHealthyThresholdColumn,
  healthCheckUnhealthyThresholdColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: row => {
          const h = this.$createElement
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({
        statusModule: 'healthCheck',
        vm: this,
      }),
      healthCheckTypeColumn(),
      healthCheckUriColumn(),
      healthCheckPortColumn(),
      // healthCheckDomainColumn(),
      healthCheckMethodColumn(),
      healthCheckHttpCodeColumn(),
      healthCheckIntervalColumn(),
      healthCheckTimeoutColumn(),
      healthCheckHealthyThresholdColumn(),
      healthCheckUnhealthyThresholdColumn(),
      getBrandTableColumn(),
      getAccountTableColumn(),
      getProjectTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
