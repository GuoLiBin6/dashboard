import { h } from 'vue'
import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getBrandTableColumn,
} from '@/utils/common/tableColumn'
import {
  getNameFilter,
} from '@/utils/common/tableFilter'
import { sizestr } from '@/utils/utils'

export default {
  data () {
    return {
      diskProps: {
        list: this.$list.createList(this, {
          resource: 'disks',
          getParams: () => {
            const params = {
              filter: 'status.in(\'ready\')',
              binding_snapshotpolicy: false,
            }
            if (this.params.data[0]?.brand === 'OneCloud') {
              params.unused = false
            } else {
              params.manager_id = this.params.data[0]?.manager_id
            }
            if (this.params.data[0]?.cloudregion_id) {
              params.cloudregion_id = this.params.data[0].cloudregion_id
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
              return h('side-page-trigger', {
                onTrigger: () => this.handleOpenSidepage(row),
              }, {
                default: () => row.name,
              })
            },
          }),
          getStatusTableColumn({ statusModule: 'disk' }),
          {
            field: 'disk_size',
            title: this.$t('table.title.disk_size'),
            minWidth: 50,
            formatter: ({ cellValue }) => {
              return sizestr(cellValue, 'M', 1024)
            },
          },
          {
            field: 'disk_type',
            title: this.$t('table.title.disk_type'),
            width: 70,
            formatter: ({ cellValue }) => {
              return cellValue === 'sys' ? this.$t('compute.text_49') : this.$t('compute.text_50')
            },
          },
          {
            field: 'guest',
            title: this.$t('res.server'),
            minWidth: 100,
            showOverflow: 'ellipsis',
            slots: {
              default: ({ row }) => {
                if (!row.guest || row.guests.length <= 0) return '-'
                const guests = row.guests.map((guest, index) => {
                  return h('side-page-trigger', {
                    permission: 'server_get',
                    name: 'VmInstanceSidePage',
                    id: guest.id,
                    vm: this,
                    tab: 'vm-instance-detail',
                  }, {
                    default: () => [
                      guest.name,
                      h('status', { status: guest.status, statusModule: 'server' }),
                    ],
                  })
                })
                return [
                  h('div', {}, guests),
                ]
              },
            },
          },
          getBrandTableColumn(),
          {
            field: 'guest_snapshotpolicy_count',
            title: this.$t('compute.guest_snapshotpolicy_count'),
            formatter: ({ row }) => {
              return row.guest_snapshotpolicy_count || 0
            },
          },
        ],
      },
    }
  },
}
