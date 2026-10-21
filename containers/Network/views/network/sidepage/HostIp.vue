<template>
  <page-list
    :list="list"
    :columns="columns" />
</template>

<script>
export default {
  name: 'Hostip',
  // SidePage 透传 columns/resource 时勿覆盖本地 page-list 绑定
  inheritAttrs: false,
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      list: this.$list.createList(this, {
        id: 'HostipForNetworkSidePage',
        resource: 'guestnetworks',
        getParams: {
          details: true,
          with_meta: true,
          network_id: this.data.id,
        },
      }),
      columns: [
        {
          field: 'guest',
          title: this.$t('network.text_657'),
        },
        {
          field: 'ip_addr',
          title: this.$t('network.text_213'),
        },
        {
          field: 'mac_addr',
          title: this.$t('network.text_228'),
        },
        {
          field: 'driver',
          title: this.$t('network.text_658'),
        },
      ],
    }
  },
  created () {
    this.list.fetchData()
  },
}
</script>
