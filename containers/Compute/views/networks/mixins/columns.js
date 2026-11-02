import i18n from '@/locales'
import { getCopyWithContentTableColumn, getTimeTableColumn, getStatusTableColumn, getBillingTypeTableColumn } from '@/utils/common/tableColumn'
import { getIpAddrColumn, getIp6AddrColumn, getNetworkIdColumn } from '../utils/columns'

export default {
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  created () {
    this.columns = [
      {
        field: 'index',
        title: i18n.t('compute.text_375'),
        width: 50,
        slots: {
          default: ({ rowIndex }) => {
            return rowIndex
          },
        },
      },
      getCopyWithContentTableColumn({ field: 'ifname', title: i18n.t('compute.text_384'), sortable: true }),
      getCopyWithContentTableColumn({ field: 'mac_addr', title: i18n.t('compute.text_385'), sortable: true }),
      getIpAddrColumn(),
      getIp6AddrColumn(),
      getCopyWithContentTableColumn({ field: 'eip_addr', title: 'EIP', sortable: true }),
      getCopyWithContentTableColumn({ field: 'driver', title: i18n.t('compute.text_860') }),
      getNetworkIdColumn({ vm: this }),
      {
        field: 'bw_limit',
        title: i18n.t('compute.text_387'),
        width: 100,
        formatter: ({ row }) => {
          if (row.rx_bw_limit && row.tx_bw_limit) {
            return `${row.tx_bw_limit}Mbps/${row.rx_bw_limit}Mbps`
          }
          if (+row.bw_limit) {
            return `${row.bw_limit}Mbps`
          }
          return `0(${this.$t('common.not_limited')})`
        },
        slots: {
          default: ({ row }, h) => {
            const create = h || this.$createElement
            const ret = []
            if (row.rx_bw_limit && row.tx_bw_limit) {
              ret.push(create('div', [
                ' ',
                create('a-icon', { props: { type: 'arrow-up' } }),
                ` ${row.tx_bw_limit} Mbps`,
              ]))
              ret.push(create('div', [
                ' ',
                create('a-icon', { props: { type: 'arrow-down' } }),
                ` ${row.rx_bw_limit} Mbps`,
              ]))
            } else if (+row.bw_limit) {
              ret.push(create('div', [
                ' ',
                create('a-icon', { props: { type: 'swap' } }),
                ` ${row.bw_limit}Mbps `,
              ]))
            } else {
              ret.push(create('div', `0(${this.$t('common.not_limited')})`))
            }
            return ret
          },
        },
      },
      getBillingTypeTableColumn(),
      {
        field: 'num_queues',
        title: i18n.t('compute.num_queues'),
        slots: {
          default: ({ row }) => {
            return row.num_queues || '-'
          },
        },
      },
      getStatusTableColumn({
        field: 'is_default',
        title: i18n.t('compute.nics.is_default'),
        statusModule: 'enabled',
        minWidth: 30,
      }),
      {
        field: 'network_addresses',
        title: i18n.t('compute.sub_ips.title'),
        slots: {
          default: ({ row }, h) => {
            const { network_addresses = [] } = row
            const ret = []
            network_addresses.map(item => {
              if (item.type === 'sub_ip') {
                ret.push(
                  h(
                    'list-body-cell-wrap',
                    {
                      props: {
                        copy: true,
                        row: { ip: item.ip_addr },
                        field: 'ip',
                        hideField: true,
                      },
                    },
                    [item.ip_addr],
                  ),
                )
              }
            })
            return ret.length ? ret : '-'
          },
        },
      },
      {
        field: 'port_mappings',
        title: i18n.t('compute.port_mappings.title', 'port'),
        slots: {
          default: ({ row }, h) => {
            return [
              this.$t('compute.text_619', [row.port_mappings ? row.port_mappings.length : 0]),
              h(
                'a-button',
                {
                  class: 'pl-1',
                  attrs: { type: 'link' },
                  on: {
                    click: () =>
                      this.viewContentDialog(
                        row.port_mappings,
                        this.$t('compute.port_mappings.title'),
                        'port',
                      ),
                  },
                },
                [this.$t('common.view')],
              ),
            ]
          },
        },
      },
      getTimeTableColumn(),
      {
        field: 'secgroups',
        title: i18n.t('compute.text_105'),
        slots: {
          default: ({ row }, h) => {
            const target = (this.data.network_secgroups || []).filter(
              item => item.mac === row.mac_addr,
            )
            console.log(target)
            return target.length
              ? target[0].secgroups.map(item =>
                h(
                  'list-body-cell-wrap',
                  {
                    props: {
                      copy: true,
                      hideField: true,
                      field: 'name',
                      row: item,
                      message: item.name,
                    },
                  },
                  [
                    h(
                      'side-page-trigger',
                      {
                        props: {
                          permission: 'secgroups_get',
                          name: 'SecGroupSidePage',
                          id: item.id,
                          vm: this,
                          tab: 'secgroup-detail',
                        },
                      },
                      [item.name],
                    ),
                  ],
                ),
              )
              : '-'
          },
        },
        formatter: ({ row }) => {
          const target = (this.data.network_secgroups || []).filter(item => item.mac === row.mac_addr)
          return target.length ? target[0].secgroups.map(item => item.name).join(',') : '-'
        },
      },
    ]
  },
  methods: {
    viewContentDialog (data, title, type) {
      this.createDialog('ViewContentDialog', {
        title,
        data,
        type,
      })
    },
  },
}
