<template>
  <event-list :obj-id="resId" :obj-type="resType" :list-id="id" :getParams="getParams" :enableVirtualScroll="enableVirtualScroll" />
</template>

<script>
import EventList from '@/sections/EventList'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'EventDrawer',
  components: {
    EventList,
  },
  mixins: [WindowsMixin],
  // SidePage 动态组件常透传 columns/resource，不能落到 EventList 上
  inheritAttrs: false,
  props: {
    // 吞掉 SidePage 无关透传，避免影响事件列表
    resource: { type: [String, Function], default: undefined },
    columns: { type: Array, default: undefined },
    id: {
      type: String,
    },
    resId: {
      type: String,
    },
    resType: {
      type: String,
    },
    enableVirtualScroll: {
      type: Boolean,
      default: false,
    },
    getParams: [Object, Function],
  },
}
</script>
