<template>
  <block-storage-list
    :id="id"
    :getParams="getParams"
    :cloudEnv="cloudEnv"
    :hidenGroupActions="true" />
</template>

<script>
import BlockStorageList from '@Storage/views/blockstorage/components/List'

export default {
  name: 'StorageListForHostSidepage',
  components: {
    BlockStorageList,
  },
  // SidePage 透传 host columns 时勿覆盖块存储列表自身列
  inheritAttrs: false,
  props: {
    id: String,
    getParams: {
      type: [Function, Object],
    },
    cloudEnv: String,
  },
}
</script>
