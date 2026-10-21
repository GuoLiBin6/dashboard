<template>
  <vminstance-list
    :hidden-actions="['create']"
    :hiddenFilterOptions="['host']"
    :id="id"
    :getParams="getParams" />
</template>

<script>
import VminstanceList from '@Compute/views/vminstance/components/List'

export default {
  name: 'VminstanceListForWireSidepage',
  components: {
    VminstanceList,
  },
  // SidePage 透传 wire columns 时勿覆盖虚机列表自身列
  inheritAttrs: false,
  props: {
    id: String,
    getParams: [Function, Object],
  },
}
</script>
