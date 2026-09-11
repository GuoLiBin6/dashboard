<template>
  <detail
    :on-manager="onManager"
    :data="data"
    :base-info="baseInfo" />
</template>

<script>
import WindowsMixin from '@/mixins/windows'
import { getEnabledTableColumn, getCopyWithContentTableColumn } from '@/utils/common/tableColumn'

export default {
  name: 'TapServiceDetail',
  mixins: [WindowsMixin],
  props: {
    data: {
      type: Object,
      required: true,
    },
    onManager: {
      type: Function,
      required: true,
    },
    cloudEnv: {
      type: String,
    },
  },
  data () {
    return {
      baseInfo: [
        getEnabledTableColumn(),
        {
          title: this.$t('compute.text_175'),
          field: 'type',
          formatter: ({ row }) => {
            if (row.type === 'host') {
              return this.$t('compute.host_port')
            }
            if (row.type === 'guest') {
              return this.$t('compute.guest_port')
            }
            return '-'
          },
        },
        {
          title: this.$t('compute.target_name'),
          field: 'target',
          slots: {
            default: ({ row }, h) => {
              return h('list-body-cell-wrap', {
                props: {
                  copy: true,
                  row: row,
                  field: 'target',
                  title: row.target,
                  hideField: true,
                },
              }, [
                h('side-page-trigger', {
                  props: {
                    permission: row.type === 'host' ? 'hosts_get' : 'server_get',
                    name: row.type === 'host' ? 'HostSidePage' : 'VmInstanceSidePage',
                    id: row.target_id,
                    vm: this,
                  },
                }, row.target),
              ])
            },
          },
        },
        {
          title: this.$t('compute.target_ip'),
          field: 'target_ips',
          slots: {
            default: ({ row }, h) => {
              const { target_ips = '' } = row
              const ips = target_ips.split(',')
              return ips.map(ip => {
                return h('list-body-cell-wrap', {
                  props: {
                    copy: true,
                    field: 'ip',
                    row: { ip },
                    title: ip,
                  },
                })
              })
            },
          },
        },
        getCopyWithContentTableColumn({
          field: 'mac_addr',
          title: this.$t('compute.target_mac'),
          hideField: true,
          message: (row) => {
            return row.mac_addr
          },
          slotCallback: (row) => {
            return row.mac_addr
          },
        }),
        {
          title: this.$t('compute.flow_count'),
          field: 'flow_count',
        },
      ],
    }
  },
}
</script>
