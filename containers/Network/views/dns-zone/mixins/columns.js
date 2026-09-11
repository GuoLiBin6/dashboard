import {
  getNameDescriptionTableColumn,
  getBrandTableColumn,
  getPublicScopeTableColumn,
  getProjectTableColumn,
  getAccountTableColumn,
  getTagTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'
import {
  getZoneTypeTableColumns,
  getVpcCountTableColumns,
  getDnsRecordsetCountTableColumns,

} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        title: i18n.t('network.text_156'),
        edit: false,
        formRules: function (row) {
          return [
            { required: true, message: i18n.t('network.text_173') },
          ]
        },
        slotCallback: row => {
          const h = this.$createElement
          return h('side-page-trigger', {
            props: {
              onTrigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getTagTableColumn({ onManager: this.onManager, resource: 'dns_zones', columns: () => this.columns }),
      getBrandTableColumn(),
      getZoneTypeTableColumns(),
      getDnsRecordsetCountTableColumns(),
      getVpcCountTableColumns(),
      {
        field: 'status',
        title: i18n.t('common.status'),
        sortable: true,
        showOverflow: 'ellipsis',
        minWidth: 80,
        slots: {
          default: ({ row }) => {
            const h = this.$createElement
            const popoverContentChildren = []
            if (row.registrar) {
              popoverContentChildren.push(
                h('div', { class: 'd-flex' }, [
                  h('span', { style: { flex: '0 0 150px' } }, this.$t('network.dnszone.registrar') + ':'),
                  h('span', [
                    row.registrar,
                    h('copy', { class: 'ml-1', props: { message: row.registrar } }),
                  ]),
                ]),
              )
            }
            if (row.name_servers && row.name_servers.length > 0) {
              popoverContentChildren.push(
                h('div', { class: 'd-flex' }, [
                  h('span', { style: { flex: '0 0 150px' } }, this.$t('network.dnszone.add_name_servers') + ':'),
                  h('span', { style: { flex: 1 } }, row.name_servers.map((server, index) =>
                    h('div', { key: index }, [
                      server,
                      h('copy', { class: 'ml-1', props: { message: server } }),
                    ]),
                  )),
                ]),
              )
            }
            if (row.original_name_servers && row.original_name_servers.length > 0) {
              popoverContentChildren.push(
                h('div', { class: 'd-flex' }, [
                  h('span', { style: { flex: '0 0 150px' } }, this.$t('network.dnszone.del_name_servers') + ':'),
                  h('span', { style: { flex: 1 } }, row.original_name_servers.map((server, index) =>
                    h('div', { key: index }, [
                      server,
                      h('copy', { class: 'ml-1', props: { message: server } }),
                    ]),
                  )),
                ]),
              )
            }
            const statusChildren = []
            if (row.status === 'pending') {
              statusChildren.push(
                h('a-popover', {
                  scopedSlots: {
                    content: () => h('div', popoverContentChildren),
                  },
                }, [
                  h('icon', {
                    class: 'ml-1',
                    style: { color: 'red' },
                    props: { type: 'dashboard-alert-sum' },
                  }),
                ]),
              )
            }
            return [
              h('div', { class: 'text-truncate' }, [
                h('div', { class: 'd-flex align-items-center' }, [
                  h('status', {
                    props: {
                      status: row.status,
                      statusModule: 'dnszone',
                    },
                  }, statusChildren),
                ]),
              ]),
            ]
          },
        },
        formatter: ({ row }) => {
          return this.$te(`status.dnszone.${row.status}`) ? this.$t(`status.dnszone.${row.status}`) : row.status
        },
      },
      getPublicScopeTableColumn({ vm: this, resource: 'dns_zones' }),
      getAccountTableColumn(),
      getProjectTableColumn(),
      getTimeTableColumn(),
    ]
  },
}
