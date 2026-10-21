<template>
  <page-list
    :list="list"
    :columns="columns" />
</template>

<script>
export default {
  name: 'LbIp',
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
        id: 'LbIpForNetworkSidePage',
        resource: 'loadbalancernetworks',
        getParams: {
          details: true,
          network_id: this.data.id,
        },
      }),
      columns: [
        {
          field: 'loadbalancer',
          title: this.$t('network.text_667'),
        },
        {
          field: 'ip_addr',
          title: this.$t('network.text_248'),
        },
        {
          field: 'created_at',
          title: this.$t('network.text_313'),
          formatter: ({ cellValue }) => {
            return this.$moment(cellValue).format(this.$t('network.text_36'))
          },
        },
      ],
    }
  },
  created () {
    this.list.fetchData()
  },
}
</script>
