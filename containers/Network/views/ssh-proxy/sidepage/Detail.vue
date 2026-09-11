<template>
  <detail
      :on-manager="onManager"
      :data="data"
      :base-info="baseInfo"
      :extra-info="extraInfo" />
</template>

<script>
export default {
  name: 'SshProxyDetail',
  props: {
    data: {
      type: Object,
      required: true,
    },
    onManager: {
      type: Function,
      required: true,
    },
    columns: Array,
  },
  data () {
    return {
      baseInfo: [
        {
          field: 'intranet_ip_addr',
          title: this.$t('network.ssh-proxy.intranet_ip_addr'),
          minWidth: 120,
          slots: {
            default: ({ row }, h) => {
              return [h('div', [
                h('list-body-cell-wrap', {
                  props: {
                    hideField: true,
                    copy: true,
                    field: 'intranet_ip_addr',
                    row: row,
                  },
                }, [
                  h('span', { style: { color: 'var(--oc-color-text-secondary)' } }, row.intranet_ip_addr || '-'),
                ]),
              ])]
            },
          },
        },
        {
          field: 'host',
          title: this.$t('network.ssh-proxy.host'),
          minWidth: 120,
          slots: {
            default: ({ row }, h) => {
              return [h('div', [
                h('list-body-cell-wrap', {
                  props: {
                    hideField: true,
                    copy: true,
                    field: 'host',
                    row: row,
                  },
                }, [
                  h('span', { style: { color: 'var(--oc-color-text-secondary)' } }, row.host || '-'),
                ]),
              ])]
            },
          },
        },
        { field: 'port', title: this.$t('network.ssh-proxy.port') },
      ],
      extraInfo: [],
    }
  },
}
</script>
