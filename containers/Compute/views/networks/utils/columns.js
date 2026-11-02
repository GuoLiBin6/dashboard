import i18n from '@/locales'

export const getIpAddrColumn = () => {
  return {
    field: 'ip_addr',
    title: i18n.t('compute.text_386'),
    sortable: true,
    showOverflow: 'ellipsis',
    minWidth: 100,
    slots: {
      default: ({ row }, h) => {
        if (row.ip_addr) {
          const addrs = [
            h('div', `${i18n.t('compute.text_386')}: ${row.ip_addr}/${row.guest_ip_mask}`),
            h('div', `${i18n.t('network.ipv4.gateway')}: ${row.guest_gateway}`),
          ]
          if (row.mapped_ip_addr) {
            addrs.push(h('div', `${i18n.t('compute.vpc.mapped_addr')}: ${row.mapped_ip_addr}`))
          }
          return [
            h('a-popover', {
              scopedSlots: {
                content: () => addrs,
              },
            }, [
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row,
                  field: 'ip_addr',
                  hideField: true,
                },
              }, `${row.ip_addr}/${row.guest_ip_mask}`),
            ]),
          ]
        }
        return '-'
      },
    },
  }
}

export const getIp6AddrColumn = () => {
  return {
    field: 'ip6_addr',
    title: i18n.t('compute.ipv6.address'),
    sortable: true,
    showOverflow: 'ellipsis',
    minWidth: 200,
    slots: {
      default: ({ row }, h) => {
        if (row.ip6_addr) {
          const addrs = [
            h('div', `${i18n.t('compute.ipv6.address')}: ${row.ip6_addr}/${row.guest_ip6_mask}`),
            h('div', `${i18n.t('network.ipv6.gateway')}: ${row.guest_gateway6}`),
          ]
          if (row.mapped_ip6_addr) {
            addrs.push(h('div', `${i18n.t('compute.vpc.mapped_addr')}: ${row.mapped_ip6_addr}`))
          }
          return [
            h('a-popover', {
              scopedSlots: {
                content: () => addrs,
              },
            }, [
              h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row,
                  field: 'ip6_addr',
                  hideField: true,
                },
              }, `${row.ip6_addr}/${row.guest_ip6_mask}`),
            ]),
          ]
        }
        return '-'
      },
    },
  }
}

export const getNetworkIdColumn = ({ vm } = {}) => {
  return {
    field: 'network_id',
    title: i18n.t('compute.text_106'),
    sortable: true,
    showOverflow: 'ellipsis',
    minWidth: 100,
    slots: {
      default: ({ row }, h) => {
        return [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              row,
              field: 'network',
              hideField: true,
            },
          }, [
            h('side-page-trigger', {
              on: {
                trigger: () => vm.handleOpenNetworkDetail(row.network_id),
              },
            }, row.network),
          ]),
        ]
      },
    },
  }
}
