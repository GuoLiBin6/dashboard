import { getNameDescriptionTableColumn, getProjectTableColumn, getBrandTableColumn, getAccountTableColumn } from '@/utils/common/tableColumn'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        hideField: true,
        edit: false,
        onManager: this.onManager,
        slotCallback: row => {
          const h = this.$createElement
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row, ''),
            },
          }, row.name)
        },
      }),
      {
        field: 'ips',
        title: 'IP',
        formatter: ({ row }) => {
          if (row.access_ip) {
            return row.access_ip
          } else if (row.ips) {
            return row.ips
          }
          return '-'
        },
      },
      {
        field: 'alert_state',
        title: this.$t('monitor.monitorresources.alert_state'),
        sortable: true,
        slots: {
          default: ({ row }) => {
            const h = this.$createElement
            return [
              h('div', { class: 'text-truncate' }, [
                h('status', {
                  props: {
                    status: row.alert_state,
                    statusModule: 'monitorresources',
                  },
                }),
              ]),
            ]
          },
        },
      },
      {
        field: 'status',
        title: this.$t('common.status'),
        sortable: true,
        slots: {
          default: ({ row }, h) => {
            let m = 'server'
            if (row.res_type) {
              if (row.res_type === 'guest') {
                m = 'server'
              } else if (row.res_type === 'storage') {
                m = 'blockstorage'
              } else {
                m = row.res_type
              }
            }
            return [
              this.$createElement('div', { class: 'text-truncate' }, [
                this.$createElement('status', {
                  props: {
                    status: row.status,
                    statusModule: m,
                  },
                }),
              ]),
            ]
          },
        },
      },
      getBrandTableColumn(),
      getAccountTableColumn({ vm: this }),
      getProjectTableColumn({ vm: this, title: this.$t('common_547', ['']) }),
    ]
    this.extandData = {}
  },
}
