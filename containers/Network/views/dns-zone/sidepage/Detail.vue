<template>
  <detail
    :on-manager="onManager"
    :data="data"
    :base-info="baseInfo"
    resource="dns_zones"
    statusModule="dnszone"
    :hidden-keys="['status']"
    :nameProps="{edit: false}" />
</template>

<script>
import {
  getZoneTypeTableColumns,
} from '../utils/columns'

export default {
  name: 'DnsZoneDetail',
  props: {
    data: {
      type: Object,
      required: true,
    },
    onManager: {
      type: Function,
      required: true,
    },
  },
  data () {
    return {
      baseInfo: [
        {
          field: 'custom_status',
          title: this.$t('common.status') + ' ',
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
        getZoneTypeTableColumns(),
        {
          field: 'dns_record_count',
          title: this.$t('network.text_718'),
          formatter: ({ row }) => {
            const h = this.$createElement
            return h('a', {
              on: {
                click: () => this.$emit('tab-change', 'dns-recordset-list-for-dns-zone-sidepage'),
              },
            }, row.dns_record_count)
          },
        },
        {
          field: 'vpc_count',
          title: this.$t('network.text_719'),
          formatter: ({ row }) => {
            if (row.zone_type === 'PublicZone' || row.cloud_env === 'onpremise') return row.vpc_count
            const h = this.$createElement
            return h('a', {
              on: {
                click: () => this.$emit('tab-change', 'dns-associate-vpc-list'),
              },
            }, row.vpc_count)
          },
        },
      ],
    }
  },
}
</script>
