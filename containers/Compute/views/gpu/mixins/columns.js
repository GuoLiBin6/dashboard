import i18n from '@/locales'
import {
  getNameDescriptionTableColumn,
  getCopyWithContentTableColumn,
  getRegionTableColumn,
  getPublicScopeTableColumn,
} from '@/utils/common/tableColumn'
import {
  getReserveResourceColumn,
  getSharingModeColumn,
  getMemorySizeColumn,
  getVirtualNumColumn,
  getMemoryAllocatedColumn,
  getAllocatedCountColumn,
} from '../utils/columns'

function getGuestList (row) {
  const { guest, guest_status } = row
  if (!guest || (Array.isArray(guest) && !guest.length)) return []
  const names = Array.isArray(guest) ? guest : [guest]
  const statuses = Array.isArray(guest_status) ? guest_status : names.map(() => guest_status)
  const seen = new Set()
  const list = []
  names.forEach((name, index) => {
    if (!name || seen.has(name)) return
    seen.add(name)
    list.push({
      name,
      status: statuses[index],
    })
  })
  return list
}

function getVendorIconType (row) {
  if (row.vendor) {
    return row.vendor.toLowerCase()
  }
  const vendorId = row.vendor_device_id?.split(':')[0]
  const DEVICE_MAP = {
    '10de': 'nvidia',
    1002: 'amd',
    '1d94': 'hygon',
    '1ec6': 'vastaitech',
  }
  return DEVICE_MAP[vendorId]
}

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row, 'gpu-detail'),
            },
          }, row.name)
        },
      }),
      {
        field: 'dev_type',
        title: i18n.t('compute.text_481'),
        width: 120,
        showOverflow: 'ellipsis',
      },
      {
        field: 'vendor',
        title: i18n.t('compute.isolated_devices.vendor.title'),
        width: 100,
        showOverflow: 'ellipsis',
        formatter: ({ row }) => row.vendor || '-',
      },
      {
        field: 'model',
        title: i18n.t('compute.text_482'),
        minWidth: 120,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            const iconType = getVendorIconType(row)
            return [
              h('div', { class: 'd-flex' }, [
                h('span', { class: 'text-truncate' }, row.model),
                iconType ? h('icon', {
                  class: 'ml-1',
                  style: { lineHeight: '24px' },
                  props: { type: iconType },
                }) : null,
              ]),
            ]
          },
        },
        formatter: ({ row }) => row.model,
      },
      {
        field: 'vendor_device_id',
        title: i18n.t('compute.isolated_devices.vendor_device_id.title'),
        width: 120,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            if (row.vendor_device_id) {
              if (row.vendor_device_id === '0000:0000') {
                return row.vendor_device_id
              } else {
                const url = 'https://admin.pci-ids.ucw.cz/read/PC/' + row.vendor_device_id.replace(':', '/')
                return [
                  h('list-body-cell-wrap', {
                    props: {
                      copy: true,
                      hideField: true,
                      field: 'vendor_device_id',
                      row,
                      message: row.vendor_device_id,
                    },
                  }, [
                    h('div', { class: 'd-flex' }, [
                      h('span', { class: 'text-truncate' }, row.vendor_device_id),
                      h('a', {
                        attrs: {
                          href: url,
                          target: 'pciid',
                        },
                      }, [
                        h('icon', {
                          props: {
                            type: 'link',
                          },
                        }),
                      ]),
                    ]),
                  ]),
                ]
              }
            }
          },
        },
        formatter: ({ row }) => {
          return row.vendor_device_id
        },
      },
      {
        field: 'addr',
        title: 'PCI ADDR',
        width: 100,
        showOverflow: 'ellipsis',
        formatter: function ({ row }) {
          return row.addr || '-'
        },
      },
      {
        field: 'device_path',
        title: i18n.t('compute.isolated_devices.device_path.title'),
        width: 120,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            const ret = []
            if (row.device_path) {
              ret.push(
                h('list-body-cell-wrap', {
                  props: {
                    copy: true,
                    hideField: true,
                    field: 'device_path',
                    row,
                    message: row.device_path,
                  },
                }, row.device_path),
              )
            }
            return ret
          },
        },
        formatter: ({ row }) => {
          return row.device_path
        },
      },
      {
        field: 'numa_node',
        title: 'NUMA',
        width: 80,
        formatter: function ({ row }) {
          if (row.numa_node >= 0) {
            return row.numa_node
          }
          return '-'
        },
      },
      {
        field: 'guest',
        title: this.$t('compute.associated_instances'),
        minWidth: 180,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }, h) => {
            const guests = getGuestList(row)
            if (this.isPreLoad && !guests.length) return [h('data-loading')]
            if (!guests.length) return '-'
            return [
              h('div', {}, guests.map((guest, index) => {
                return h('div', { class: 'd-flex align-items-center', key: index }, [
                  h('side-page-trigger', {
                    on: {
                      trigger: () => this.handleOpenSidepage(row, 'associated-instances'),
                    },
                  }, guest.name),
                  guest.status ? h('div', { class: 'ml-2' }, [
                    h('status', {
                      props: {
                        status: guest.status,
                        statusModule: 'server',
                      },
                    }),
                  ]) : null,
                ])
              })),
            ]
          },
        },
        formatter: ({ row }) => {
          const guests = getGuestList(row)
          return guests.length ? guests.map(guest => guest.name).join(', ') : '-'
        },
      },
      getCopyWithContentTableColumn({
        field: 'host',
        title: i18n.t('compute.text_484'),
        hideField: true,
        slotCallback: row => {
          if (this.isPreLoad && !(row.host && row.host_id)) return [this.$createElement('data-loading')]
          return row.host || row.host_id
        },
      }),
      getReserveResourceColumn(),
      getSharingModeColumn(),
      getMemorySizeColumn(),
      {
        ...getMemoryAllocatedColumn(),
        hidden: () => !this.gpuResource,
      },
      getVirtualNumColumn(),
      {
        ...getAllocatedCountColumn(),
        hidden: () => !this.gpuResource,
      },
      getPublicScopeTableColumn({ resource: 'isolated_devices', vm: this, title: this.$t('compute.text_113') }),
      getRegionTableColumn({ vm: this }),
    ]
  },
}
