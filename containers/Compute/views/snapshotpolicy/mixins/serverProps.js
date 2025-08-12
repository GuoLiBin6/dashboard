import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getBrandTableColumn,
} from '@/utils/common/tableColumn'
import {
  getNameFilter,
} from '@/utils/common/tableFilter'

export default {
  data () {
    return {
      serverProps: {
        list: this.$list.createList(this, {
          resource: 'servers',
          getParams: () => {
            const params = {
              filter: 'status.in(\'ready\',\'running\')',
              cloud_env: 'onpremise',
              binding_snapshotpolicy: false,
            }
            return params
          },
          filterOptions: {
            name: getNameFilter(),
          },
        }),
        columns: [
          getNameDescriptionTableColumn({
            onManager: this.onManager,
            hideField: true,
            formRules: [
              { required: true, message: this.$t('compute.text_210') },
              { validator: this.$validate('resourceCreateName') },
            ],
            slotCallback: row => {
              return (
                <side-page-trigger onTrigger={ () => this.handleOpenSidepage(row) }>{ row.name }</side-page-trigger>
              )
            },
          }),
          getStatusTableColumn({ statusModule: 'server' }),
          getBrandTableColumn(),
        ],
      },
    }
  },
}
