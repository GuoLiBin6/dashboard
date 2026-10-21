<template>
  <task-page
    :resource="taskResource"
    :archivedResource="archivedResource"
    :obj-id="resId"
    :list-id="id || 'TaskListForCustomResourceSidePage'"
    :getParams="getParams"
    isSidepage
    :ignoreResId="ignoreResId"
    root />
</template>

<script>
import TaskPage from '@/sections/TaskPage'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'TaskDrawer',
  components: {
    TaskPage,
  },
  mixins: [WindowsMixin],
  // SidePage 动态组件常透传 resource=images/guests，若继承到 TaskPage 会盖掉 taskResource
  inheritAttrs: false,
  props: {
    // 吞掉 SidePage 的 resource，避免 fallthrough 覆盖 :resource="taskResource"
    resource: {
      type: [String, Function],
      default: undefined,
    },
    taskResource: {
      type: String,
      default: 'compute-tasks',
    },
    id: {
      type: String,
    },
    resId: {
      type: String,
    },
    getParams: [Object, Function],
    ignoreResId: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    archivedResource () {
      if (this.taskResource && this.taskResource.includes('-tasks')) {
        return this.taskResource.replace('-tasks', '-archivedtasks')
      }
      return ''
    },
  },
}
</script>
