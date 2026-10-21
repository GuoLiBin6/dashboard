<template>
  <network-list
    :hidden-actions="['create']"
    :hidden-columns="['brand', 'region', 'account', 'tenant']"
    :hidden-filter-options="['vpc']"
    :id="id"
    :getParams="getParams" />
</template>

<script>
import NetworkList from '@Network/views/network/components/List'

export default {
  name: 'NetworkListForVpcSidepage',
  components: {
    NetworkList,
  },
  // SidePage 透传 vpc columns 时勿覆盖 IP 子网列表自身列
  inheritAttrs: false,
  props: {
    id: String,
    getParams: [Function, Object],
  },
}
</script>
