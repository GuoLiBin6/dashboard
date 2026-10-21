<template>
  <network-list
    :hidden-actions="['create']"
    :hidden-columns="['brand', 'region', 'account', 'tenant', 'vpc', 'wire']"
    :id="id"
    :getParams="getParams" />
</template>

<script>
import NetworkList from '@Network/views/network/components/List'

export default {
  name: 'NetworkListForWireSidepage',
  components: {
    NetworkList,
  },
  // SidePage 透传 wire columns 时勿覆盖 IP 子网列表自身列
  inheritAttrs: false,
  props: {
    id: String,
    getParams: [Function, Object],
  },
}
</script>
