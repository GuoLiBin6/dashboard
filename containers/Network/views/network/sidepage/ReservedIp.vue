<template>
  <page-list
    :list="list"
    :columns="columns" />
</template>

<script>
export default {
  name: 'ReservedIp',
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
        id: 'ReservedIpForNetworkSidePage',
        resource: 'reservedips',
        getParams: {
          details: true,
          with_meta: true,
          network_id: this.data.id,
        },
      }),
      columns: [
        {
          field: 'ip_addr',
          title: this.$t('network.text_213'),
        },
        {
          field: 'notes',
          title: this.$t('network.text_668'),
        },
      ],
    }
  },
  created () {
    this.list.fetchData()
  },
}
</script>
